import React from 'react';
import { Diamond, Compass, Heart } from 'lucide-react';

const AboutSection = () => {
    const values = [
        {
            icon: Diamond,
            title: "Triết Lý",
            description: "Tỉnh thức trong đầu tư. Quay về bên trong để sửa mình."
        },
        {
            icon: Compass,
            title: "Tầm Nhìn",
            description: "Kiến tạo hệ sinh thái giáo dục Tài chính & Tâm linh thực chiến."
        },
        {
            icon: Heart,
            title: "Sứ Mệnh",
            description: "Đồng hành 1:1, đánh thức sức mạnh nội tại và nuôi dưỡng thói quen thịnh vượng."
        }
    ];

    return (
        <section className="py-10 lg:py-24 bg-[#FAF7F2] overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 lg:px-8">

                {/* Main Content - Mobile: Row Layout (Magazine), Desktop: Row (Card) */}
                <div className="flex flex-row-reverse items-center lg:items-start lg:flex-row gap-4 lg:gap-14 mb-8 lg:mb-10">

                    {/* Image Column */}
                    <div className="w-[40%] lg:w-[320px] flex-shrink-0 relative">
                        {/* Desktop Card Style */}
                        <div className="hidden lg:block relative">
                            <div className="absolute -left-3 -top-3 h-full w-full rounded-2xl border border-[#8B2E2E]/20" />
                            <div className="relative z-10 overflow-hidden rounded-2xl shadow-xl bg-white">
                                <img
                                    src="https://res.cloudinary.com/dstukyjzd/image/upload/v1767669416/Mong_2_ljry7m.png"
                                    alt="Coach Mong"
                                    className="w-full h-auto object-contain"
                                />
                            </div>
                            <div className="absolute -bottom-3 -right-3 z-20 bg-white rounded-xl shadow-lg px-4 py-2.5 border border-[#8B2E2E]/10">
                                <p className="text-[11px] text-gray-500 font-medium">Người sáng lập</p>
                                <p className="text-sm font-bold text-[#8B2E2E]">Coach Mong</p>
                            </div>
                        </div>

                        {/* Mobile Magazine Style */}
                        <div className="lg:hidden relative flex justify-center items-end h-48">
                            {/* Decorative Blob */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-t from-[#8B2E2E]/30 to-transparent rounded-full blur-xl" />

                            <img
                                src="https://res.cloudinary.com/dstukyjzd/image/upload/v1767669416/Mong_2_ljry7m.png"
                                alt="Coach Mong"
                                className="relative z-10 w-full h-full object-contain drop-shadow-xl scale-125 origin-bottom"
                            />
                        </div>
                    </div>

                    {/* Right Column - Content */}
                    <div className="flex-1 flex flex-col lg:block min-h-0 text-center lg:text-left">
                        {/* Mobile Badge & Title */}
                        <div className="lg:hidden mb-2">
                            <div className="inline-block px-3 py-1 rounded-full bg-[#8B2E2E]/10 border border-[#8B2E2E]/20 mb-2">
                                <p className="text-[10px] sm:text-xs font-bold text-[#8B2E2E] uppercase tracking-wider">Người sáng lập</p>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#8B2E2E] leading-tight">
                                Về Mali EDU
                            </h2>
                        </div>

                        {/* Desktop Header */}
                        <div className="hidden lg:block mb-5">
                            <h2 className="text-[2.5rem] text-[#1a1a1a] font-bold leading-tight mb-2">
                                Về Mali EDU
                            </h2>
                            <p className="text-[#5a5a5a] text-base leading-relaxed">
                                Hệ sinh thái đào tạo & coaching phát triển bản thân
                            </p>
                        </div>

                        {/* Content Body - Floating Card on Desktop, Plain on Mobile */}
                        <div className="relative group lg:overflow-hidden lg:bg-gradient-to-br lg:from-white lg:to-[#fffcf8] lg:rounded-[2rem] lg:p-10 lg:border lg:border-[#E8E4DC] lg:shadow-[0_20px_50px_-12px_rgba(139,46,46,0.15)] transition-all duration-300">
                            {/* Desktop Decor */}
                            <div className="hidden lg:block absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8B2E2E] via-[#C8A96A] to-[#8B2E2E]" />
                            <div className="hidden lg:block absolute -right-6 -top-6 w-24 h-24 bg-[#C8A96A]/5 rounded-full blur-2xl/10" />

                            <div className="relative z-10 space-y-4 lg:space-y-8">
                                <div>
                                    {/* Mobile/Desktop distinct styling for intro text */}
                                    <p className="text-[#2a2a2a] text-sm lg:text-xl font-medium leading-[1.6]">
                                        <span className="font-bold text-[#8B2E2E] lg:text-transparent lg:bg-clip-text lg:bg-gradient-to-r lg:from-[#8B2E2E] lg:to-[#C8A96A] uppercase tracking-wide">Mali Edu</span> đồng hành cùng bạn trên hành trình khai mở Luật Hấp Dẫn,
                                        chữa lành nội tâm và xây dựng tư duy thịnh vượng bền vững.
                                    </p>

                                    <div className="mt-4 flex gap-3 hidden lg:flex">
                                        <div className="w-1 h-auto bg-[#E8E4DC] rounded-full" />
                                        <p className="text-[#5a5a5a] text-[15px] leading-relaxed italic">
                                            "Chúng tôi kết hợp đào tạo thực chiến với coaching sâu để bạn làm chủ cảm xúc,
                                            hành động rõ ràng và sống một đời sống tự do, an lạc."
                                        </p>
                                    </div>
                                </div>

                                {/* Signature Block */}
                                <div className="pt-4 lg:pt-6 border-t border-[#8B2E2E]/10 lg:border-[#E8E4DC]/60 relative">
                                    <div className="flex items-start gap-3">
                                        <div>
                                            <h3 className="text-[#8B2E2E] text-base lg:text-lg font-bold mb-1 font-heading uppercase tracking-wider">
                                                Mong Coaching
                                            </h3>
                                            <p className="text-[#6b6b6b] text-xs lg:text-[15px] leading-relaxed">
                                                Nhà huấn luyện và dẫn dắt về tiềm thức – nội tâm – tài chính.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Value Cards - 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-6 pb-12">
                    {values.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <div
                                key={index}
                                className="group bg-white rounded-xl p-4 lg:p-6 border border-[#E8E4DC] border-l-4 border-l-[#8B2E2E] shadow-sm hover:border-[#8B2E2E]/30 hover:shadow-lg transition-all duration-300 h-auto flex flex-row lg:block items-start gap-4 lg:gap-0"
                            >
                                {/* Icon */}
                                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[#8B2E2E]/5 flex items-center justify-center shrink-0 mb-0 lg:mb-4 group-hover:bg-[#8B2E2E]/10 transition-colors duration-300">
                                    <IconComponent className="w-5 h-5 lg:w-6 lg:h-6 text-[#8B2E2E]" strokeWidth={1.5} />
                                </div>

                                {/* Content Wrapper */}
                                <div>
                                    {/* Title */}
                                    <h3 className="text-base lg:text-lg font-bold text-[#1a1a1a] mb-1 lg:mb-2 uppercase tracking-wide">
                                        {item.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-[#5a5a5a] leading-relaxed text-sm lg:text-[15px]">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default AboutSection;
