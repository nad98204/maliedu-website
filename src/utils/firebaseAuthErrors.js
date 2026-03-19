const getRawFirebaseError = (err) => {
  return [
    err?.code,
    err?.message,
    err?.error?.message,
    err?.customData?._tokenResponse?.error?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
};

export const normalizeFirebaseAuthCode = (err) => {
  if (typeof err?.code === "string" && err.code.startsWith("auth/")) {
    return err.code;
  }

  const rawError = getRawFirebaseError(err);

  if (rawError.includes("UNAUTHORIZED_DOMAIN")) {
    return "auth/unauthorized-domain";
  }

  if (rawError.includes("POPUP_BLOCKED")) {
    return "auth/popup-blocked";
  }

  if (rawError.includes("POPUP_CLOSED_BY_USER")) {
    return "auth/popup-closed-by-user";
  }

  if (rawError.includes("CANCELLED_POPUP_REQUEST")) {
    return "auth/cancelled-popup-request";
  }

  if (rawError.includes("ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL")) {
    return "auth/account-exists-with-different-credential";
  }

  if (
    rawError.includes("INVALID_LOGIN_CREDENTIALS") ||
    rawError.includes("INVALID_PASSWORD") ||
    rawError.includes("EMAIL_NOT_FOUND")
  ) {
    return "auth/invalid-login-credentials";
  }

  if (rawError.includes("INVALID_CREDENTIAL")) {
    return "auth/invalid-credential";
  }

  if (rawError.includes("INVALID_EMAIL")) {
    return "auth/invalid-email";
  }

  if (rawError.includes("EMAIL_EXISTS")) {
    return "auth/email-already-in-use";
  }

  if (
    rawError.includes("TOO_MANY_ATTEMPTS_TRY_LATER") ||
    rawError.includes("TOO_MANY_REQUESTS")
  ) {
    return "auth/too-many-requests";
  }

  if (rawError.includes("NETWORK_REQUEST_FAILED")) {
    return "auth/network-request-failed";
  }

  if (rawError.includes("OPERATION_NOT_ALLOWED")) {
    return "auth/operation-not-allowed";
  }

  if (rawError.includes("USER_DISABLED")) {
    return "auth/user-disabled";
  }

  if (rawError.includes("WEAK_PASSWORD")) {
    return "auth/weak-password";
  }

  return err?.code || "auth/unknown";
};

export const getFirebaseAuthMessage = (err, options = {}) => {
  const hostname =
    options.hostname ||
    (typeof window !== "undefined" ? window.location.hostname : "ten-mien-hien-tai");
  const code = normalizeFirebaseAuthCode(err);

  switch (code) {
    case "auth/unauthorized-domain":
      return `Tên miền ${hostname} chưa được cấp quyền đăng nhập Google trong Firebase. Hãy thêm domain này vào Authentication > Settings > Authorized domains.`;
    case "auth/popup-blocked":
      return "Trình duyệt đang chặn cửa sổ đăng nhập Google. Hãy cho phép popup và thử lại.";
    case "auth/popup-closed-by-user":
      return "Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.";
    case "auth/cancelled-popup-request":
      return "Yêu cầu đăng nhập Google trước đó đã bị hủy. Vui lòng thử lại.";
    case "auth/account-exists-with-different-credential":
      return "Email này đã tồn tại với phương thức đăng nhập khác.";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email hoặc mật khẩu không đúng.";
    case "auth/invalid-email":
      return "Email không đúng định dạng.";
    case "auth/email-already-in-use":
      return "Email này đã được sử dụng.";
    case "auth/too-many-requests":
      return "Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.";
    case "auth/operation-not-allowed":
      return "Phương thức đăng nhập này chưa được bật trong Firebase.";
    case "auth/user-disabled":
      return "Tài khoản này đã bị vô hiệu hóa.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.";
    default:
      return "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
  }
};
