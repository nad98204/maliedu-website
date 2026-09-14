const SUPER_ADMIN_EMAIL = "mongcoaching@gmail.com";

const fail = (status, code, message) => {
  throw Object.assign(new Error(message), { status, code });
};

const canManageStudents = (user, profile) => {
  if (String(user?.email || "").toLowerCase() === SUPER_ADMIN_EMAIL && user.email_verified === true) {
    return true;
  }
  if (profile?.role !== "admin") return false;
  const modules = profile.allowedModules;
  return modules === undefined
    || (Array.isArray(modules) && (modules.length === 0 || modules.includes("students")));
};

export const createAdminStudentHandler = ({ getDb, getAuth, fieldValue, json }) =>
  async ({ adminUser, request }) => {
    if (!adminUser?.uid) fail(401, "auth/required", "Vui lòng đăng nhập tài khoản quản trị.");

    const db = getDb();
    const adminProfile = await db.collection("users").doc(adminUser.uid).get();
    if (!canManageStudents(adminUser, adminProfile.data())) {
      fail(403, "admin/students-forbidden", "Bạn không có quyền quản lý học viên.");
    }

    let body;
    try {
      body = await request.json();
    } catch {
      fail(400, "request/invalid-json", "Dữ liệu tạo tài khoản không hợp lệ.");
    }
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body?.password;
    if (!name || name.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
      || typeof password !== "string" || password.length < 6 || password.length > 128) {
      fail(400, "request/invalid-student", "Họ tên, email hoặc mật khẩu không hợp lệ.");
    }

    const auth = getAuth();
    let student;
    try {
      student = await auth.createUser({ email, password, displayName: name });
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        const existingUser = await auth.getUserByEmail(email);
        const existingProfile = await db.collection("users").doc(existingUser.uid).get();
        if (!existingProfile.exists) {
          fail(409, "auth/missing-student-profile", "Email này đã có trong Firebase Authentication nhưng chưa có hồ sơ. Hãy kiểm tra và khôi phục tài khoản cũ trước khi thử lại.");
        }
        fail(409, "auth/email-already-exists", "Email này đã có tài khoản. Hãy kiểm tra tài khoản hiện có trước khi tạo lại.");
      }
      if (error.code === "auth/invalid-email" || error.code === "auth/invalid-password") {
        fail(400, error.code, "Email hoặc mật khẩu không hợp lệ.");
      }
      throw error;
    }

    try {
      await db.collection("users").doc(student.uid).create({
        uid: student.uid,
        email: student.email,
        displayName: name,
        role: "student",
        createdAt: fieldValue.serverTimestamp(),
        photoURL: student.photoURL || null,
      });
    } catch (error) {
      try {
        await auth.deleteUser(student.uid);
      } catch (rollbackError) {
        console.error("Could not roll back Auth user after student profile write failed", {
          uid: student.uid,
          error: rollbackError,
        });
        fail(503, "student/profile-orphaned", "Tài khoản xác thực đã tạo nhưng hồ sơ chưa lưu được. Cần quản trị viên kiểm tra trước khi thử lại.");
      }
      console.error("Student profile write failed; Auth user rolled back", { uid: student.uid, error });
      fail(503, "student/profile-write-failed", "Không lưu được hồ sơ học viên. Tài khoản chưa được tạo; hãy thử lại.");
    }

    return json({ uid: student.uid, email: student.email }, 201, { "cache-control": "no-store" });
  };
