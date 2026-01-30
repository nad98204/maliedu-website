import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../firebase";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Get code from URL (Firebase sends it as 'oobCode')
    const oobCode = searchParams.get("oobCode");

    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [isVerifying, setIsVerifying] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // 1. Verify Code on Mount
    useEffect(() => {
        if (!oobCode) {
            setError("Đường dẫn không hợp lệ hoặc đã hết hạn.");
            setIsVerifying(false);
            return;
        }

        verifyPasswordResetCode(auth, oobCode)
            .then((email) => {
                setEmail(email);
                setIsVerifying(false);
            })
            .catch((error) => {
                console.error(error);
                setError("Đường dẫn đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.");
                setIsVerifying(false);
            });
    }, [oobCode]);

    // 2. Handle Password Reset
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return setError("Mật khẩu nhập lại không khớp.");
        }
        if (newPassword.length < 6) {
            return setError("Mật khẩu phải có ít nhất 6 ký tự.");
        }

        setIsSubmitting(true);
        setError("");

        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setSuccess(true);
            setTimeout(() => navigate("/admin/login"), 3000); // Redirect to login after 3s
        } catch (err) {
            console.error(err);
            setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 text-secret-wax animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Đang kiểm tra đường dẫn...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
                {/* Header */}
                <div className="bg-secret-wax p-6 text-center">
                    <img
                        src="https://res.cloudinary.com/dstukyjzd/image/upload/v1768455801/Logo_Mali_Ngang_M%C3%80U_CAM_u5lrng.png"
                        alt="Mali Edu"
                        className="h-12 w-auto mx-auto mb-4 object-contain brightness-0 invert"
                    />
                    <h1 className="text-2xl font-bold text-white">Đặt lại mật khẩu</h1>
                    <p className="text-white/80 text-sm mt-1">Nhập mật khẩu mới cho tài khoản của bạn</p>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center space-y-4 animate-fade-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Thành công!</h2>
                            <p className="text-slate-500">
                                Mật khẩu của bạn đã được thay đổi. Đang chuyển hướng về trang đăng nhập...
                            </p>
                            <button
                                onClick={() => navigate("/admin/login")}
                                className="inline-block mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
                            >
                                Đăng nhập ngay
                            </button>
                        </div>
                    ) : error ? (
                        <div className="text-center space-y-4 animate-fade-in">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Liên kết lỗi</h2>
                            <p className="text-slate-500">{error}</p>
                            <button
                                onClick={() => navigate("/admin/login")}
                                className="inline-block mt-4 px-6 py-2 border border-slate-300 rounded-lg font-bold hover:bg-slate-50 transition"
                            >
                                Quay lại trang chủ
                            </button>
                        </div>
                    ) : (
                        /* Reset Form */
                        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4 text-center">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Tài khoản</p>
                                <p className="font-medium text-slate-900">{email}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700">Mật khẩu mới</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none transition-all"
                                            placeholder="Nhập mật khẩu mới..."
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-700">Nhập lại mật khẩu</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax outline-none transition-all"
                                            placeholder="Xác nhận mật khẩu..."
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-secret-wax text-white font-bold py-3.5 rounded-xl hover:bg-secret-ink transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                                ) : (
                                    "Đổi mật khẩu"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
