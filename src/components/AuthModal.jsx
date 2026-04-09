import { useEffect, useState } from 'react';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db, createGoogleProvider } from '../firebase';
import { ensureUserProfile } from '../utils/userService';
import { getFirebaseAuthMessage } from '../utils/firebaseAuthErrors';
import { warmUpGoogleSignIn } from '../utils/googleAuthWarmup';

import { isInAppBrowser } from '../utils/browserDetection';
import InAppBrowserModal from './InAppBrowserModal';

const syncGoogleUserProfile = async (user) => {
    try {
        await ensureUserProfile({ db, user });
    } catch (err) {
        console.error('Google profile sync failed:', err?.code, err?.message, err);
    }
};

const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [showBrowserWarning, setShowBrowserWarning] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [error, setError] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setError('');
        setShowBrowserWarning(false);
        setGoogleLoading(false);
        setEmailLoading(false);
        warmUpGoogleSignIn();
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleGoogleLogin = async () => {
        // Step 1: Check for In-App Browser (Zalo, FB, etc.)
        if (isInAppBrowser()) {
            setShowBrowserWarning(true);
            return;
        }

        if (googleLoading || emailLoading) {
            return;
        }

        setGoogleLoading(true);
        setError('');

        try {
            warmUpGoogleSignIn();
            const provider = createGoogleProvider({ emailHint: email });
            const result = await signInWithPopup(auth, provider);

            onClose();
            void syncGoogleUserProfile(result.user);
        } catch (err) {
            console.error('Google login failed:', err?.code, err?.message, err);
            setError(getFirebaseAuthMessage(err));
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();

        if (googleLoading || emailLoading) {
            return;
        }

        setEmailLoading(true);
        setError('');

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    displayName: fullName,
                    role: 'student',
                    createdAt: serverTimestamp()
                });
            }

            onClose();
        } catch (err) {
            console.error('Email auth failed:', err?.code, err?.message, err);
            setError(getFirebaseAuthMessage(err));
        } finally {
            setEmailLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full p-2 transition-colors hover:bg-slate-100"
                >
                    <X className="h-5 w-5 text-slate-500" />
                </button>

                <div className="p-8">
                    <div className="mb-8 text-center">
                        <h2 className="mb-2 text-2xl font-bold text-slate-900">
                            {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {isLogin
                                ? 'Đăng nhập để tiếp tục việc học của bạn'
                                : 'Tham gia cùng cộng đồng học viên Mali Edu'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        onMouseEnter={warmUpGoogleSignIn}
                        onFocus={warmUpGoogleSignIn}
                        onTouchStart={warmUpGoogleSignIn}
                        disabled={googleLoading || emailLoading}
                        className="relative mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                    >
                        {googleLoading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                        ) : (
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                className="h-5 w-5"
                            />
                        )}
                        <span>{googleLoading ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}</span>
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400">Hoặc</span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-700">Họ và tên</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 font-medium transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secret-wax"
                                        placeholder="Nguyễn Văn A"
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-700">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 font-medium transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secret-wax"
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-700">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 font-medium transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secret-wax"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={googleLoading || emailLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
                        >
                            {emailLoading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : (
                                <>
                                    {isLogin ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500">
                            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            disabled={googleLoading || emailLoading}
                            className="font-bold text-secret-wax transition-colors hover:text-secret-ink disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLogin ? 'Đăng ký miễn phí' : 'Đăng nhập ngay'}
                        </button>
                    </div>
                </div>
            </div>

            <InAppBrowserModal 
                isOpen={showBrowserWarning} 
                onClose={() => setShowBrowserWarning(false)} 
            />
        </div>
    );
};

export default AuthModal;
