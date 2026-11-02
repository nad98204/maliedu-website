import { createHash } from 'node:crypto';

export const GRATITUDE_COURSE = Object.freeze({
  id: '21-ngay-long-biet-on',
  name: 'THỬ THÁCH 21 NGÀY ĐÁNH THỨC PHÉP MÀU LÒNG BIẾT ƠN!',
  startDate: '2026-10-29',
  time: '05:00',
  timezone: 'Asia/Ho_Chi_Minh',
  days: 21,
  price: 0,
  zaloUrl: 'https://zalo.me/g/oycqyorw5kgzftwyyyvl',
});

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export const normalizeCommunityPhone = value => {
  let phone = typeof value === 'string' ? value.trim().replace(/[\s.()-]/g, '') : '';
  if (phone.startsWith('+84')) phone = '0' + phone.slice(3);
  else if (phone.startsWith('84')) phone = '0' + phone.slice(2);
  return /^0[35789]\d{8}$/.test(phone) ? phone : '';
};
export const registrationKey = phone => createHash('sha256').update(`${GRATITUDE_COURSE.id}:${phone}`).digest('hex');

export const createCommunityRegistrationHandlers = ({ getDb, fieldValue, json }) => {
  const courseRef = () => getDb().collection('community_courses').doc(GRATITUDE_COURSE.id);
  const rowsRef = () => getDb().collection(`community_courses/${GRATITUDE_COURSE.id}/registrations`);
  const reply = (data, status = 200) => json(data, status, { 'cache-control': 'no-store' });
  return {
    register: async ({ request }) => {
      let body;
      try { body = await request.json(); } catch { fail(400, 'Thông tin đăng ký không hợp lệ.'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'Thông tin đăng ký không hợp lệ.');
      if (body.courseId !== GRATITUDE_COURSE.id) fail(400, 'Chương trình đăng ký không hợp lệ.');
      const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
      const phone = normalizeCommunityPhone(body.phone);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (name.length < 2 || name.length > 120 || /[\u0000-\u001f<>]/.test(name)) fail(400, 'Vui lòng nhập họ tên từ 2 đến 120 ký tự.');
      if (!phone) fail(400, 'Vui lòng nhập số điện thoại di động Việt Nam hợp lệ.');
      if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) fail(400, 'Email chưa đúng định dạng.');
      if (body.consent !== true) fail(400, 'Vui lòng đồng ý sử dụng thông tin để hỗ trợ đăng ký chương trình.');
      if (body.website) fail(400, 'Chưa thể gửi đăng ký. Vui lòng thử lại.');
      const referralCode = text(body.referralCode || 'cong-ty', 101).toLowerCase();
      if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(referralCode)) fail(400, 'Mã giới thiệu không hợp lệ. Vui lòng mở lại link đăng ký.');
      const ref = rowsRef().doc(registrationKey(phone));
      const leadRef = getDb().collection('leads').doc('community_' + ref.id);
      const course = courseRef();
      // One phone per course. A retry must never overwrite an existing person's details.
      await getDb().runTransaction(async tx => {
        const [existing, metadata, mirror] = await Promise.all([tx.get(ref), tx.get(course), tx.get(leadRef)]);
        if (existing.exists && mirror.exists) return;
        const utm = {};
        for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
          utm[key] = text(body.utm?.[key], 200);
        }
        const pagePath = text(body.pagePath, 240).split(/[?#]/)[0];
        const registration = existing.exists ? existing.data() : {
          name, phone, email, courseId: GRATITUDE_COURSE.id, courseName: GRATITUDE_COURSE.name,
          referralCode, source: GRATITUDE_COURSE.id, status: 'new',
          consent: true, consentVersion: 'community-registration-v2', consentMethod: 'submit-with-notice',
          createdAt: fieldValue.serverTimestamp(),
          pagePath: pagePath.startsWith('/') ? pagePath : '', utm,
        };
        // Save the referral view in the same transaction as the registration.
        // Legacy registrations are mirrored from their original details on retry.
        if (!mirror.exists) tx.create(leadRef, {
          name: registration.name, phone: registration.phone, email: registration.email || '',
          source: GRATITUDE_COURSE.id, courseId: GRATITUDE_COURSE.id, courseName: GRATITUDE_COURSE.name,
          landingPageId: GRATITUDE_COURSE.id,
          referralCode: registration.referralCode || 'cong-ty',
          status: registration.status || 'new', note: '',
          sourceUrl: 'https://luathapdan.vn/dao-tao/21-ngay-long-biet-on',
          utmSource: registration.utm?.utm_source || '', utm: registration.utm || {},
          createdAt: registration.createdAt,
        });
        if (existing.exists) return;
        tx.create(ref, registration);
        tx.set(course, {
          ...GRATITUDE_COURSE,
          registrationCount: (Number(metadata.data()?.registrationCount) || 0) + 1,
          updatedAt: fieldValue.serverTimestamp(),
        }, { merge: true });
      });
      // Identical acknowledgement for new and repeated submissions; no personal data is returned.
      return reply({ success: true, courseId: GRATITUDE_COURSE.id, zaloUrl: GRATITUDE_COURSE.zaloUrl });
    },
    list: async ({ request, adminUser }) => {
      if (!adminUser?.uid) fail(401, 'Vui lòng đăng nhập tài khoản quản trị.');
      const profile = await getDb().collection('users').doc(adminUser.uid).get();
      const data = profile.data();
      const superAdmin = adminUser.email?.toLowerCase() === 'mongcoaching@gmail.com' && adminUser.email_verified === true;
      const modules = data?.allowedModules;
      if (!superAdmin && !(data?.role === 'admin' && (modules === undefined || (Array.isArray(modules) && (!modules.length || modules.includes('community-registrations') || modules.includes('referral-customers')))))) {
        fail(403, 'Bạn không có quyền xem đăng ký chương trình cộng đồng.');
      }
      const params = new URL(request.url).searchParams;
      const cursor = params.get('cursor');
      if (cursor && !/^[a-f0-9]{64}$/.test(cursor)) fail(400, 'Vị trí tải dữ liệu không hợp lệ.');
      let query = rowsRef().orderBy('createdAt', 'desc').limit(200);
      if (cursor) {
        const doc = await rowsRef().doc(cursor).get();
        if (!doc.exists) fail(400, 'Vị trí tải dữ liệu không còn tồn tại. Vui lòng làm mới.');
        query = query.startAfter(doc);
      }
      const [snapshot, course] = await Promise.all([query.get(), courseRef().get()]);
      const registrations = snapshot.docs.map(doc => {
        const row = doc.data();
        return { id: doc.id, name: row.name, phone: row.phone, email: row.email,
          courseId: row.courseId, courseName: row.courseName, pagePath: row.pagePath, utm: row.utm,
          referralCode: row.referralCode || 'cong-ty', status: row.status || 'new', source: GRATITUDE_COURSE.id,
          createdAt: row.createdAt?.toDate?.().toISOString() || (row.createdAt instanceof Date ? row.createdAt.toISOString() : null) };
      });
      return reply({ course: GRATITUDE_COURSE, total: course.data()?.registrationCount || 0, registrations,
        nextCursor: snapshot.size === 200 ? snapshot.docs.at(-1).id : null });
    },
  };
};
