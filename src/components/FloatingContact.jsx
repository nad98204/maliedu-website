import { Phone } from "lucide-react";
import { HOTLINE } from "../menuData";
import { useLocation } from "react-router";

const FloatingContact = () => {
    const location = useLocation();
    
    // Ẩn nút liên hệ trên trang quản trị admin và các trang nghe thôi miên / thiền định
    // để tránh che khuất thanh phát nhạc, nút bấm mở nghe và làm gián đoạn người nghe
    if (
        location.pathname.startsWith("/admin") ||
        location.pathname.startsWith("/thoi-mien")
    ) {
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
                className="group relative flex items-center justify-center w-12 h-12 bg-[#0068FF] rounded-full shadow-lg shadow-blue-600/30 text-white hover:bg-[#0057d6] hover:scale-110 transition-all duration-300"
                title="Chat Zalo"
                aria-label="Chat Zalo"
            >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M12 2C6.48 2 2 6.03 2 11c0 2.88 1.5 5.46 3.86 7.15l-1.02 3.07a.6.6 0 0 0 .76.76l3.52-1.26C10.19 20.9 11.08 21 12 21c5.52 0 10-4.03 10-10S17.52 2 12 2z"
                        fill="#FFFFFF"
                    />
                    <path
                        d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9453 0 1.0746.8697 1.9453 1.945 1.9453z"
                        fill="#0068FF"
                        transform="matrix(0.72 0 0 0.72 3.36 3.3)"
                    />
                </svg>
                <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Chat Zalo
                </span>
            </a>
        </div>
    );
};

export default FloatingContact;
