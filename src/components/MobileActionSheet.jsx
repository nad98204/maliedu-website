import { X, ChevronRight } from "lucide-react";
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
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {items?.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            onClick={onClose}
                            className="flex items-center justify-between p-4 rounded-xl active:bg-gray-50 transition-colors group"
                        >
                            <span className="text-base font-medium text-gray-700 group-hover:text-secret-wax">
                                {item.label}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
};

export default MobileActionSheet;
