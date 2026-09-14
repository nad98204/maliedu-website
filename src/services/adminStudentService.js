import { auth } from "../firebase";

export const createStudentAccount = async (student, retryAfterRefresh = true) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw Object.assign(new Error("Vui lòng đăng nhập tài khoản quản trị."), { code: "auth/required" });
  }

  const token = await currentUser.getIdToken(!retryAfterRefresh);
  const response = await fetch("/api/admin/students", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(student),
  });

  if (response.status === 401 && retryAfterRefresh) {
    return createStudentAccount(student, false);
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(
      new Error(result.error || "Không thể tạo tài khoản học viên."),
      { code: result.code || `api/${response.status}` },
    );
  }
  return result;
};
