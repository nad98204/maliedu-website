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
        <section className="py-12 lg:py-24 bg-[#FAF7F2] overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 lg:px-8">

                {/* Main Content Grid - Mobile */}
                <div className="lg:hidden space-y-4">
                    {/* Founder Image Mobile */}
                    <div className="relative mx-auto w-full max-w-[280px]">
                        <img
                            src="https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1773736929295-661078967--o-Tr-ng-C--i-Gh-p-Banner.png"
                            alt="Coach Mong"
                            className="w-full h-auto rounded-[32px] shadow-xl object-contain max-h-[350px]"
                        />
                        {/* Badge */}
                        <div className="absolute -bottom-2 -right-1 bg-white rounded-lg shadow-md px-2.5 py-1 border border-secret-wax/10">
                            <p className="text-[9px] text-slate-500">Người sáng lập</p>
                            <p className="text-[11px] font-bold text-secret-wax">Coach Mong</p>
                        </div>
                    </div>

                    {/* Content Stack Mobile */}
                    <div className="space-y-4 mt-6">
                        {/* Header */}
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-[#1a1a1a]">Về Mali EDU</h2>
                            <p className="text-base text-slate-500 font-medium mt-1">
                                Hệ sinh thái đào tạo & coaching
                            </p>
                        </div>

                        {/* MALI EDU Box */}
                        <div className="bg-gradient-to-br from-secret-wax/10 to-transparent rounded-2xl p-4 border border-secret-wax/20">
                            <p className="text-[#2a2a2a] text-base leading-relaxed">
                                <span className="font-bold text-secret-wax">MALI EDU</span> đồng hành cùng bạn trên hành trình khai mở Luật Hấp Dẫn, chữa lành nội tâm và xây dựng tư duy thịnh vượng.
                            </p>
                            {/* Quote */}
                            <div className="mt-3 flex gap-2">
                                <div className="w-0.5 bg-secret-wax/30 rounded-full" />
                                <p className="text-xs text-slate-600 leading-relaxed italic">
                                    "Kết hợp đào tạo thực chiến với coaching sâu..."
                                </p>
                            </div>
                        </div>

                        {/* MONG COACHING Box */}
                        <div className="bg-white rounded-2xl p-4 shadow-md border-l-4 border-secret-wax">
                            <h3 className="text-lg font-bold text-secret-wax">MONG COACHING</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Nhà huấn luyện và dẫn dắt về tiềm thức – nội tâm – tài chính.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid - Desktop */}
                <div className="hidden lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-8 lg:py-0 mb-6 lg:mb-8">
                    {/* Left: Founder Image */}
                    <div className="relative mx-auto w-full max-w-[400px]">
                        <div className="relative">
                            <img
                                src="https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1773736929295-661078967--o-Tr-ng-C--i-Gh-p-Banner.png"
                                alt="Coach Mong"
                                className="w-full h-auto rounded-[40px] shadow-2xl object-contain max-h-[500px]"
                            />
                            {/* Badge */}
                            <div className="absolute bottom-4 -right-3 bg-white rounded-xl shadow-lg px-3 py-1.5 border border-secret-wax/10">
                                <p className="text-[10px] text-slate-500 font-medium">Người sáng lập</p>
                                <p className="text-xs font-bold text-secret-wax">Coach Mong</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Content Stack */}
                    <div className="space-y-6">
                        {/* Header */}
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black text-[#1a1a1a] leading-tight">
                                Về Mali EDU
                            </h2>
                            <p className="text-lg text-slate-500 font-medium mt-2">
                                Hệ sinh thái đào tạo & coaching phát triển bản thân
                            </p>
                        </div>

                        {/* MALI EDU Box */}
                        <div className="bg-gradient-to-br from-secret-wax/10 to-transparent rounded-3xl p-6 border border-secret-wax/20">
                            <p className="text-[#2a2a2a] text-lg leading-relaxed">
                                <span className="font-bold text-secret-wax uppercase tracking-wide">MALI EDU</span> đồng hành cùng bạn trên hành trình khai mở Luật Hấp Dẫn,
                                chữa lành nội tâm và xây dựng tư duy thịnh vượng bền vững.
                            </p>

                            {/* Quote */}
                            <div className="mt-4 flex gap-3">
                                <div className="w-1 bg-secret-wax/30 rounded-full" />
                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                    "Chúng tôi kết hợp đào tạo thực chiến với coaching sâu để bạn làm chủ cảm xúc,
                                    hành động rõ ràng và sống một đời sống tự do, an lạc."
                                </p>
                            </div>
                        </div>

                        {/* MONG COACHING Box */}
                        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border-l-4 border-secret-wax">
                            <h3 className="text-xl font-bold text-secret-wax mb-1">
                                MONG COACHING
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                Nhà huấn luyện và dẫn dắt về tiềm thức – nội tâm – tài chính.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3 Pillars Section - Mobile */}
                <div className="lg:hidden grid grid-cols-1 gap-3 mt-6">
                    {values.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100"
                            >
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                    <IconComponent className="w-5 h-5 text-secret-wax" strokeWidth={1.5} />
                                </div>
                                {/* Text */}
                                <div>
                                    <h3 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wide">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 3 Pillars Section - Desktop */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
                    {values.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <div
                                key={index}
                                className="p-6 lg:p-8 rounded-[32px] bg-white border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Icon Container */}
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                                    <IconComponent className="w-6 h-6 text-secret-wax" strokeWidth={1.5} />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-black mt-4 text-[#1a1a1a] uppercase tracking-wide">
                                    {item.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default AboutSection;
