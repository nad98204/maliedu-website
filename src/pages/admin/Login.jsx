import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { auth } from "../../firebase";
import { completeAdminLogin } from "../../utils/adminLoginFlow";
import { signInWithGoogle } from "../../utils/googleAuthFlow";
import { getFirebaseAuthMessage } from "../../utils/firebaseAuthErrors";
import { isInAppBrowser } from "../../utils/browserDetection";
import InAppBrowserModal from "../../components/InAppBrowserModal";
import { MALI_LOGO_URL } from "../../constants/brandAssets.js";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState("");
  const [resetSentMessage, setResetSentMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);

  const handleAfterLogin = async (user) => {
    navigate(await completeAdminLogin(user));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResetSentMessage("");
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleAfterLogin(userCredential.user);
    } catch (err) {
      console.error(err);
      setError(getFirebaseAuthMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }

    setError("");
    setResetSentMessage("");
    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setResetSentMessage(
        `Đã gửi liên kết đặt lại mật khẩu tới ${trimmedEmail}. Vui lòng kiểm tra hộp thư đến (hoặc mục Thư rác / Spam).`
      );
    } catch (err) {
      console.error(err);
      setError(getFirebaseAuthMessage(err, { mode: "reset-password" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Step 1: Check for In-App Browser (Zalo, FB, etc.)
    if (isInAppBrowser()) {
      setShowBrowserWarning(true);
      return;
    }

    setError("");
    setResetSentMessage("");
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle({ intent: "admin" });
      if (!result) return;
      await handleAfterLogin(result.user);
    } catch (err) {
      console.error(err);
      setError(getFirebaseAuthMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="text-center space-y-2">
          <img
            src={MALI_LOGO_URL}
            alt="Logo"
            className="h-14 mx-auto mb-5 object-contain"
          />
          <h1 className="text-2xl font-bold text-slate-900">
            {isForgotPassword ? "Quên mật khẩu?" : "Đăng nhập hệ thống"}
          </h1>
          <p className="text-slate-500 text-sm">
            {isForgotPassword
              ? "Nhập email của bạn để nhận liên kết đặt lại mật khẩu"
              : "Chào mừng bạn trở lại với Mali Edu"}
          </p>
        </div>

        {isForgotPassword ? (
          <div className="mt-8 space-y-4">
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="reset-email">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 transition"
                  placeholder="email@example.com"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 p-2.5 rounded border border-red-100">
                  {error}
                </p>
              )}

              {resetSentMessage && (
                <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{resetSentMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-secret-wax py-2.5 text-sm font-bold text-white transition hover:bg-secret-ink disabled:opacity-70 mt-2"
              >
                {isSubmitting
                  ? "Đang gửi..."
                  : resetSentMessage
                    ? "Gửi lại liên kết"
                    : "Gửi liên kết đặt lại mật khẩu"}
              </button>
            </form>

            <div className="pt-2 text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError("");
                  setResetSentMessage("");
                }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-secret-wax font-medium hover:underline disabled:opacity-60"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                Tiếp tục với Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Hoặc</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 transition"
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700" htmlFor="password">
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError("");
                        setResetSentMessage("");
                      }}
                      disabled={isSubmitting}
                      className="text-xs font-semibold text-secret-wax hover:underline disabled:opacity-60"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 transition"
                    placeholder="Nhập mật khẩu"
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-secret-wax py-2.5 text-sm font-bold text-white transition hover:bg-secret-ink disabled:opacity-70 mt-2"
                >
                  {isSubmitting ? "Đang xử lý..." : "Đăng nhập với email"}
                </button>
              </form>
            </div>

            <div className="mt-6 text-center text-sm text-slate-500">
              Chưa có tài khoản?{" "}
              <Link to="/dang-ky" className="text-secret-wax font-medium hover:underline">
                Đăng ký ngay
              </Link>
            </div>
          </>
        )}
      </div>

      <InAppBrowserModal 
        isOpen={showBrowserWarning} 
        onClose={() => setShowBrowserWarning(false)} 
      />
    </div>
  );
};

export default Login;
