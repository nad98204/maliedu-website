import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, crmFirestore } from "../firebase";
import { ensureUserProfile } from "../utils/userService";
import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [remoteConfig, setRemoteConfig] = useState({
        is_maintenance: false,
        isLoading: true
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const docRef = doc(crmFirestore, "public_settings", "landing_config");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRemoteConfig({ ...docSnap.data(), isLoading: false });
                } else {
                    setRemoteConfig(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error("Error fetching landing config:", error);
                setRemoteConfig(prev => ({ ...prev, isLoading: false }));
            }
        };
        fetchConfig();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        if (password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        setIsSubmitting(true);

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            console.log("✅ User created in Auth:", cred.user.email);

            // Create user profile in Firestore
            try {
                await ensureUserProfile({ db, user: cred.user });
                console.log("✅ User profile created in Firestore");
            } catch (profileError) {
                console.error("⚠️ Failed to create user profile:", profileError);
                // Continue anyway - user can still login, profile will be created on next login
            }

            // Success - Redirect to My Courses
            navigate("/khoa-hoc-cua-toi");
        } catch (err) {
            console.error("❌ Registration error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Email này đã được sử dụng.");
            } else {
                setError("Đăng ký thất bại. Vui lòng thử lại.");
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
                        Đăng ký tài khoản
                    </h1>
                    <p className="text-slate-500 text-sm">Tạo tài khoản để tham gia khóa học</p>
                </div>

                {remoteConfig.is_maintenance ? (
                    <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-3">
                        <p className="text-amber-700 font-bold">Hệ thống đang bảo trì</p>
                        <p className="text-slate-600 text-sm">Hệ thống đang bảo trì để nâng cấp. Vui lòng quay lại sau!</p>
                    </div>
                ) : (
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
                                placeholder="vidu@email.com"
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
                                placeholder="Tối thiểu 6 ký tự"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                                Xác nhận mật khẩu
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 transition"
                                placeholder="Nhập lại mật khẩu"
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-lg bg-secret-wax py-2.5 text-sm font-bold text-white transition hover:bg-secret-ink disabled:opacity-70 mt-2"
                        >
                            {isSubmitting ? "Đang xử lý..." : "Đăng ký ngay"}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-sm text-slate-500">
                    Đã có tài khoản?{" "}
                    <Link to="/admin/login" className="text-secret-wax font-medium hover:underline">
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
