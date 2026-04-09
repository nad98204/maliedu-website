import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, ExternalLink, MoreVertical } from 'lucide-react';

/**
 * A premium modal informing users that they cannot use Google Login
 * inside restricted in-app browsers like Zalo, Facebook, TikTok.
 */
const InAppBrowserModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-white/20"
                >
                    <div className="relative p-8 text-center">
                        {/* Status Icon with Glow */}
                        <div className="relative mx-auto w-20 h-20 mb-6">
                            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
                            <div className="relative w-full h-full bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-800/50">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                            Lỗi Trình Duyệt Nhúng
                        </h3>
                        
                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed px-2">
                            Google không cho phép đăng nhập từ trình duyệt của <b>Zalo/Facebook/TikTok</b> để bảo vệ tài khoản của bạn.
                        </p>

                        <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl text-left mb-8 border border-amber-100 dark:border-amber-800/50">
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
                                <ExternalLink className="w-4 h-4" /> Cách khắc phục:
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                                Vui lòng bấm vào nút <span className="inline-flex bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm mx-1 border border-slate-200 dark:border-slate-700"><MoreVertical className="w-3.5 h-3.5"/></span> ở phía trên góc phải màn hình và chọn <b>'Mở bằng trình duyệt'</b> (hoặc Open in Safari/Chrome).
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/20"
                        >
                            Đã hiểu
                        </button>
                    </div>

                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InAppBrowserModal;
