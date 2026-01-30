import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import { auth, db } from "../../firebase";
import { ensureUserProfile } from "../../utils/userService";
import { registerSession } from "../../utils/sessionService";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const ADMIN_EMAILS = ["mongcoaching@gmail.com"];
      const isAdmin = ADMIN_EMAILS.includes(user.email);

      // Check Session Limit
      try {
        await registerSession(user.uid, isAdmin);
      } catch (sessionError) {
        if (sessionError.message === "MAX_SESSIONS_REACHED") {
          await signOut(auth);
          setError("Tài khoản đang đăng nhập quá 3 thiết bị! Vui lòng đăng xuất ở thiết bị cũ trước.");
          setIsSubmitting(false);
          return;
        }
        console.error("Session Register Error:", sessionError);
      }

      await ensureUserProfile({ db, user });

      if (isAdmin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/khoa-hoc-cua-toi");
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("Email hoặc mật khẩu không chính xác.");
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="text-center space-y-2">
          <img
            src="https://res.cloudinary.com/dstukyjzd/image/upload/v1768455801/Logo_Mali_Ngang_M%C3%80U_CAM_u5lrng.png"
            alt="Logo"
            className="h-10 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-slate-900">
            Đăng nhập hệ thống
          </h1>
          <p className="text-slate-500 text-sm">Chào mừng bạn trở lại với Mali Edu</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Mật khẩu
            </label>
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
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link to="/dang-ky" className="text-secret-wax font-medium hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
