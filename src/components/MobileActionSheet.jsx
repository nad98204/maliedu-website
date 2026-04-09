import { X, ChevronRight, Info, User, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const MobileActionSheet = ({ isOpen, onClose, title, items }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Prevent body scrolling when sheet is open
            document.body.style.overflow = "hidden";
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
            document.body.style.overflow = "";
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ease-out transform ${isOpen ? "translate-y-0" : "translate-y-full"
                    }`}
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-secret-wax/10 to-transparent rounded-t-2xl border-b border-secret-wax/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secret-wax/20 flex items-center justify-center">
                            <Info className="w-5 h-5 text-secret-wax" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                            <p className="text-xs text-gray-500">Khám phá thêm về Mali Edu</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                    {items?.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            onClick={onClose}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-secret-wax/30 active:scale-[0.98] transition-all"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secret-wax/20 to-secret-wax/5 flex items-center justify-center flex-shrink-0">
                                {item.label.includes("Mong") ? (
                                    <User className="w-6 h-6 text-secret-wax" />
                                ) : (
                                    <Building2 className="w-6 h-6 text-secret-wax" />
                                )}
                            </div>

                            <div className="flex-1">
                                <h4 className="text-base font-bold text-gray-900">
                                    {item.label}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {item.label.includes("Mong")
                                        ? "Tìm hiểu về người sáng lập"
                                        : "Thông tin về tổ chức"}
                                </p>
                            </div>

                            <ChevronRight className="w-5 h-5 text-secret-wax/50" />
                        </Link>
                    ))}

                    {title === "Giới thiệu" && (
                        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-secret-wax/20 to-amber-100/50">
                            <p className="text-xs text-center text-secret-wax font-medium">
                                "Đánh thức tiềm thức, kiến tạo thịnh vượng"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MobileActionSheet;
