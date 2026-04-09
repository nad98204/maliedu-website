import { Phone, MessageCircle } from "lucide-react";
import { HOTLINE } from "../menuData";
import { useLocation } from "react-router-dom";

const FloatingContact = () => {
    const location = useLocation();
    
    // Hide contact buttons on admin pages
    if (location.pathname.startsWith("/admin")) {
        return null;
    }

    // Format hotline for tel: link (remove spaces)
    const telLink = `tel:${HOTLINE.replace(/\s/g, '')}`;

    // Zalo Link (using phone number for now, replace with Zalo OA ID if available)
    // Zalo format: https://zalo.me/0355067656
    const zaloLink = `https://zalo.me/${HOTLINE.replace(/\s/g, '')}`;

    return (
        <div className="fixed bottom-[85px] md:bottom-6 right-3 lg:right-6 z-50 flex flex-col gap-3">
            {/* Phone Button */}
            <a
                href={telLink}
                className="group relative flex items-center justify-center w-12 h-12 bg-red-600 rounded-full shadow-lg shadow-red-600/30 text-white hover:bg-red-700 hover:scale-110 transition-all duration-300 animate-bounce-slow"
                title="Gọi ngay"
            >
                <Phone className="w-5 h-5 fill-current" />
                <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {HOTLINE}
                </span>

                {/* Ping Effect */}
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping -z-10"></span>
            </a>

            {/* Zalo Button */}
            <a
                href={zaloLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full shadow-lg shadow-blue-600/30 text-white hover:bg-blue-700 hover:scale-110 transition-all duration-300"
                title="Chat Zalo"
            >
                <svg className="w-6 h-6" viewBox="0 0 48 48" fill="currentColor">
                    <path d="M24 0C10.745 0 0 9.958 0 22.237c0 7.125 3.657 13.475 9.373 17.661L7.5 48l9.177-4.364C18.918 44.497 21.389 45 24 45c13.255 0 24-9.958 24-22.237S37.255 0 24 0zm11.4 30.6l-3.6-4.2-6 4.2-6-4.2-3.6 4.2 9.6-10.2 9.6 10.2z" />
                </svg>
                <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Chat Zalo
                </span>
            </a>
        </div>
    );
};

export default FloatingContact;
