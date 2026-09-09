import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Compass, LoaderCircle, LockKeyhole, Target } from "lucide-react";
import KhoiThongDongTien from "../khoi-thong-dong-tien/KhoiThongDongTien";
import { resolveKhoiThongLandingConfig } from "../khoi-thong-dong-tien/landingConfig";
import { submitToCRM } from "../../services/crmService";
import { createMetaEventId, getMetaBrowserData, initMetaPixel, trackMetaEventForPixel } from "../../utils/metaPixel";
import { buildSecretLead, SECRET_LANDING_NAME, SECRET_LANDING_PATH, validateSecretContact } from "./config";

const heroContent = {
  compact: true,
  title: SECRET_LANDING_NAME,
  question: "Bạn đã ứng dụng Luật Hấp Dẫn để thay đổi tài chính…",
  questionEmphasis: "nhưng DÒNG TIỀN VẪN CHƯA THAY ĐỔI?",
  description: <>Tìm ra điều đang khiến bạn thực hành không ra kết quả và cung cấp bạn tấm bản đồ rõ ràng— từ <strong className="font-black text-[#7A2113]">tư duy, cảm xúc đến hành động thực tế tạo ra tiền.</strong></>,
};
const painContent = {
  heading: "Bạn đã thực hành",
  headingEmphasis: "nhưng chưa có kết quả?",
  intro: "Bạn có thấy mình trong những điều này khi ứng dụng Luật Hấp Dẫn?",
  items: [
    "Muốn thực hành Luật Hấp Dẫn nhưng chưa biết bắt đầu thế nào, bản thân cũng chưa thực sự tin sẽ có kết quả.",
    "Biết ơn, câu khẳng định, hình dung… bạn đều đã thử, nhưng tài chính vẫn gần như không thay đổi.",
    "Không biết mình đang sai ở suy nghĩ, cảm xúc, niềm tin hay chính cách áp dụng Luật Hấp Dẫn.",
    "Muốn giữ suy nghĩ tích cực, nhưng mệt mỏi và áp lực về tiền bạc, cuộc sống vẫn liên tục xuất hiện.",
    "369, 555, viết kịch bản, hình dung, thông điệp tiềm thức… quá nhiều phương pháp, không biết nên tập trung vào đâu.",
    "Dành nhiều thời gian thực hành nhưng chưa biết cần đưa ra quyết định hay hành động gì để tài chính thay đổi.",
  ],
};
const audienceContent = {
  intro: "Dành cho bạn đang muốn hiểu đúng cách thực hành Luật Hấp Dẫn và biến điều mình mong muốn thành những bước đi cụ thể.",
  groups: ["Muốn bắt đầu", "Đã thực hành", "Muốn hành động"],
  cards: [
    { title: ["Muốn bắt đầu", "nhưng chưa biết cách"], Icon: Compass,
      desc: "Bạn muốn tìm một điểm khởi đầu rõ ràng, dễ áp dụng và phù hợp với chính mình.",
      painPoints: ["Chưa biết nên bắt đầu với phương pháp nào", "Muốn một cách thực hành đơn giản, dễ hiểu", "Còn hoài nghi và muốn tự mình kiểm chứng"] },
    { title: ["Đã biết, đã thử", "chưa thấy kết quả"], Icon: BookOpen,
      desc: "Bạn đã thực hành nhưng chưa thấy tài chính chuyển biến và muốn biết điều gì đang cản trở mình.",
      painPoints: ["Đã thử nhiều phương pháp nhưng chưa thấy thay đổi rõ ràng", "Không biết mình đang làm sai ở đâu", "Bắt đầu nghi ngờ liệu mình có đang áp dụng đúng"] },
    { title: ["Muốn hành động", "để tạo ra kết quả"], Icon: Target,
      desc: "Bạn muốn chủ động bước tới mục tiêu, thay vì chỉ hình dung, cầu nguyện rồi chờ đợi.",
      painPoints: ["Muốn biết bước tiếp theo để tiến gần hơn tới mục tiêu", "Muốn biến Luật Hấp Dẫn thành hành động thực tế", "Muốn chủ động đưa ra quyết định và tạo ra thay đổi"] },
  ],
};
const ctaClass = "flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#E8393F] to-[#9C0C12] px-4 py-4 text-sm font-black uppercase leading-snug text-[#FFE566] shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A2113] disabled:cursor-not-allowed disabled:opacity-60";
const inputClass = "mt-2 w-full rounded-xl border border-[#D4B572] bg-white px-4 py-3.5 text-base text-[#3A2208] outline-none transition focus:border-[#7A2113] focus:ring-2 focus:ring-[#C9961A]/30 disabled:opacity-60";
const errorClass = "mt-2 text-sm font-semibold text-[#9C0C12]";

function Registration({ config, reloadConfig }) {
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const sending = useRef(false);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("secret_landing_receipt") || "null");
      if (saved?.id && Date.now() - saved.createdAt < 30 * 60 * 1000) setReceipt(saved);
    } catch { /* Storage is optional. */ }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending.current || receipt) return;
    const nextErrors = validateSecretContact(contact);
    setErrors(nextErrors);
    setFailure("");
    if (Object.keys(nextErrors).length) {
      (nextErrors.name ? nameRef : phoneRef).current?.focus();
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const latest = await reloadConfig();
      const eventIds = { lead: createMetaEventId("lead"), registration: createMetaEventId("complete_registration") };
      let browserData = {};
      try { browserData = getMetaBrowserData(window.location.search); } catch { /* Tracking cannot block registration. */ }
      const payload = buildSecretLead({ contact, config: latest, url: window.location.href, browserData, eventIds });
      const result = await submitToCRM(payload);
      if (!result?.success || !result.id) throw new Error("Chưa gửi được đăng ký. Vui lòng thử lại.");
      const saved = { id: result.id, createdAt: Date.now(), zaloLink: latest.zaloLink };
      setReceipt(saved);
      try { sessionStorage.setItem("secret_landing_receipt", JSON.stringify(saved)); } catch { /* Registration is already saved. */ }
      try {
        if (latest.fbPixel) {
          initMetaPixel(latest.fbPixel);
          trackMetaEventForPixel(latest.fbPixel, "Lead", { content_name: SECRET_LANDING_NAME }, { eventID: eventIds.lead });
          trackMetaEventForPixel(latest.fbPixel, "CompleteRegistration", { content_name: SECRET_LANDING_NAME, status: true }, { eventID: eventIds.registration });
        }
      } catch { /* Pixel failures must not turn a saved lead into an error/retry. */ }
    } catch (error) {
      setFailure(error.message || "Chưa gửi được đăng ký. Bạn vui lòng thử lại.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  if (receipt) return <div className="rounded-2xl bg-[#FFFBF0] p-6 text-center text-[#5A3A1A] sm:p-10" role="status" aria-live="polite">
    <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-700" />
    <h3 className="text-2xl font-black text-[#7A2113]">Đăng ký thành công!</h3>
    <p className="my-5 leading-relaxed">Tham gia nhóm Zalo để nhận lịch học, đường dẫn vào lớp và tài liệu thực hành.</p>
    <a className={ctaClass} href={config?.zaloLink || receipt.zaloLink} target="_blank" rel="noopener noreferrer" onClick={() => {
      try { if (config?.fbPixel) trackMetaEventForPixel(config.fbPixel, "Contact", { content_name: SECRET_LANDING_NAME }); } catch { /* Optional tracking. */ }
    }}>Vào nhóm Zalo của lớp<ArrowRight size={18} /></a>
    <p className="mt-4 text-sm">Bạn sẽ học cùng lớp Khơi Thông Dòng Tiền của Mali Edu.</p>
  </div>;

  return <form className="rounded-2xl bg-[#FFFBF0] p-5 text-[#5A3A1A] sm:p-8" onSubmit={handleSubmit} noValidate aria-busy={busy}>
    <h3 className="text-xl font-black uppercase text-[#7A2113]">Nhận link học miễn phí</h3>
    <p className="mb-6 mt-2 text-sm leading-relaxed">Điền thông tin để nhận hướng dẫn tham gia 4 buổi học online.</p>
    <label className="block text-sm font-bold uppercase" htmlFor="secret-name">Họ và tên <span aria-hidden="true">*</span></label>
    <input className={inputClass} ref={nameRef} id="secret-name" name="name" autoComplete="name" placeholder="Nhập họ và tên của bạn" maxLength={120} required value={contact.name} disabled={busy} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "secret-name-error" : undefined} onChange={e => { setContact({ ...contact, name: e.target.value }); setErrors({ ...errors, name: "" }); }} />
    {errors.name && <p className={errorClass} id="secret-name-error">{errors.name}</p>}
    <label className="mt-5 block text-sm font-bold uppercase" htmlFor="secret-phone">Số điện thoại Zalo <span aria-hidden="true">*</span></label>
    <input className={inputClass} ref={phoneRef} id="secret-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Số điện thoại bạn dùng Zalo" maxLength={20} required value={contact.phone} disabled={busy} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "secret-phone-error" : undefined} onChange={e => { setContact({ ...contact, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }} />
    {errors.phone && <p className={errorClass} id="secret-phone-error">{errors.phone}</p>}
    {config?.is_maintenance && <p className={errorClass} role="status">Lớp học đang tạm ngưng nhận đăng ký. Bạn vui lòng quay lại sau.</p>}
    {failure && <p className={errorClass} role="alert">{failure}</p>}
    <div className="mt-6"><button className={ctaClass} type="submit" disabled={busy || config?.is_maintenance}>{busy ? <><LoaderCircle className="animate-spin" size={19} />Đang gửi đăng ký…</> : <>Đăng ký miễn phí ngay<ArrowRight size={19} /></>}</button></div>
    <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#6A4A2A]"><LockKeyhole className="mt-0.5 shrink-0" size={14} />Thông tin của bạn được dùng để liên hệ và gửi hướng dẫn tham gia lớp học.</p>
  </form>;
}

export default function BiMatLuatHapDan() {
  const [config, setConfig] = useState(null);
  async function reloadConfig() {
    const next = await resolveKhoiThongLandingConfig({ path: SECRET_LANDING_PATH, fresh: true });
    setConfig(next);
    return next;
  }
  useEffect(() => {
    let active = true;
    resolveKhoiThongLandingConfig({ path: SECRET_LANDING_PATH }).then(next => { if (active) setConfig(next); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const registration = <section className="overflow-hidden rounded-3xl border border-[#E3C675] bg-gradient-to-b from-[#8A0D13] via-[#67070C] to-[#490307] px-4 py-8 shadow-2xl sm:px-8 sm:py-12" aria-labelledby="secret-register-title">
    <header className="mx-auto mb-7 max-w-3xl text-center">
      <span className="inline-flex rounded-full border border-[#F3D477]/40 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#FFE99A]">Đăng ký tham gia miễn phí</span>
      <h2 id="secret-register-title" className="mt-4 text-2xl font-black uppercase leading-tight text-white sm:text-4xl">Đăng ký 4 buổi học<span className="mt-1 block text-[#FFE566]">Hoàn toàn miễn phí</span></h2>
      <p className="mt-4 text-sm leading-relaxed text-[#F5E6B7] sm:text-base">Nhận link Zoom và hướng dẫn tham gia chương trình Khơi Thông Dòng Tiền.</p>
      <p className="mt-2 text-sm font-bold text-[#FFE99A]">{config?.ctaScheduleLabel || "Lịch học được cập nhật trong nhóm Zalo"} · 20:00 – 22:00</p>
    </header>
    <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2">
      <Registration config={config} reloadConfig={reloadConfig} />
      <img className="w-full rounded-2xl border border-[#D4B572]/50" src="/assets/landing/khoi-thong-dong-tien/registration-banner.webp" alt="Chương trình Khơi Thông Dòng Tiền — 4 buổi học online miễn phí" loading="lazy" decoding="async" />
    </div>
  </section>;
  return <KhoiThongDongTien seoPath={SECRET_LANDING_PATH} heroContent={heroContent} painContent={painContent} audienceContent={audienceContent} registration={registration} />;
}
