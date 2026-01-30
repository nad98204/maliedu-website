import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Key, Heart, Flame, CheckCircle, ArrowRight } from 'lucide-react';

const MongCoaching = () => {
    const fadeInUp = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="bg-secret-paper text-secret-ink font-sans overflow-hidden">
            {/* Section 1: Hero Intro */}
            <section className="container mx-auto px-6 py-12 md:py-20 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Image Column */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex justify-center lg:justify-end order-2 lg:order-1"
                    >
                        <div className="relative w-full max-w-md aspect-[3/4] rounded-t-full overflow-hidden shadow-2xl border-4 border-secret-paper ring-1 ring-secret-gold/30">
                            {/* Real image should go here, using a placeholder for now as per instructions */}
                            <img
                                src="https://res.cloudinary.com/dstukyjzd/image/upload/v1767669416/Mong_2_ljry7m.png"
                                alt="Mong Coaching"
                                className="w-full h-full object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-secret-ink/20 to-transparent mix-blend-multiply"></div>
                        </div>
                    </motion.div>

                    {/* Text Column */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="text-center lg:text-left order-1 lg:order-2 space-y-6"
                    >
                        <motion.div variants={fadeInUp}>
                            <span className="text-secret-wax tracking-widest font-bold text-sm uppercase border-b border-secret-wax pb-1 inline-block">
                                Người Đồng Hành Chuyển Hóa
                            </span>
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-secret-ink leading-tight">
                            Mong Coaching
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Nhà huấn luyện và người dẫn dắt trong lĩnh vực tiềm thức – nội tâm – năng lượng – tài chính, tập trung giúp cá nhân và người kinh doanh thoát khỏi bế tắc từ gốc rễ.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="font-serif italic text-xl text-secret-wax/90 border-l-2 border-secret-gold pl-4 ml-4 lg:ml-0">
                            "Không dạy làm giàu nhanh - Chỉ đồng hành chuyển hóa bền vững."
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Section 2: Câu Chuyện Cá Nhân */}
            <section className="py-20 lg:py-28 relative bg-[#fdfaf4]">
                <div className="container mx-auto px-6 max-w-4xl">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="space-y-4"
                    >
                        {/* Title */}
                        <motion.h3 variants={fadeInUp} className="font-serif font-bold text-3xl md:text-4xl text-secret-ink tracking-wide uppercase text-center mb-2">
                            HÀNH TRÌNH TỪ BẾ TẮC ĐẾN NGƯỜI DẪN DẮT
                        </motion.h3>

                        {/* Blockquote */}
                        <motion.div
                            variants={fadeInUp}
                            className="text-center py-8 relative w-fit mx-auto"
                        >
                            <div className="border border-secret-gold/50 rounded-lg px-10 py-6 bg-white/40 backdrop-blur-sm shadow-sm">
                                <p className="font-serif text-xl md:text-2xl text-secret-wax leading-loose font-medium">
                                    "Tiền là kết quả, không phải nguyên nhân. <br className="hidden md:block" />
                                    Cuộc sống bên ngoài phản ánh trạng thái bên trong."
                                </p>
                            </div>
                        </motion.div>

                        {/* Content */}
                        <motion.div
                            variants={fadeInUp}
                            className="space-y-6 text-secret-ink/80 font-sans text-lg leading-relaxed text-left"
                        >
                            <p>
                                Mong Coaching từng trải qua giai đoạn khủng hoảng tài chính, mất phương hướng, nợ nần và áp lực cuộc sống. Những sai lệch trong niềm tin về tiền bạc, sự nóng vội trong đầu tư và thiếu hiểu biết về nội tâm đã khiến cuộc sống rơi vào bế tắc kéo dài.
                            </p>

                            <p>
                                Chỉ khi bắt đầu quay vào bên trong, quan sát lại cảm xúc, niềm tin và cách mình đang phát sóng năng lượng ra cuộc sống, mọi thứ mới dần thay đổi.
                            </p>

                            <p>
                                Từ đó, Mong Coaching từng bước chuyển hóa nội tâm, tái lập niềm tin, điều chỉnh hành động và xây dựng lại cuộc sống tài chính theo hướng bền vững hơn. Hành trình cá nhân đó chính là nền tảng để Mong Coaching trở thành người dẫn dắt và chia sẻ lại lộ trình chuyển hóa cho cộng đồng.
                            </p>

                            <div className="font-serif italic text-2xl text-secret-wax pt-8 text-right">
                                Mong Coaching
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Section 3: Triết Lý Huấn Luyện - Luxury Grid */}
            <section className="bg-secret-dark relative overflow-hidden py-24 lg:py-32">
                {/* 1. Background & Decor */}
                <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-secret-gold/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secret-gold/10 blur-3xl rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="max-w-6xl mx-auto"
                    >
                        {/* 2. Header & Hero Quote */}
                        <motion.div variants={fadeInUp} className="text-center mb-16">
                            <h2 className="font-sans font-bold text-xs md:text-sm text-secret-gold uppercase tracking-[0.3em] mb-6">
                                Triết lý huấn luyện
                            </h2>
                            <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold flex flex-col items-center gap-[1px]">
                                <span className="bg-gradient-to-r from-[#D4AF37] via-[#F9F1D8] to-[#D4AF37] bg-clip-text text-transparent leading-tight">
                                    "Tiền là kết quả,
                                </span>
                                <span className="bg-gradient-to-r from-[#D4AF37] via-[#F9F1D8] to-[#D4AF37] bg-clip-text text-transparent leading-tight">
                                    không phải nguyên nhân."
                                </span>
                            </h3>
                        </motion.div>

                        {/* 3. The Golden Grid */}
                        <motion.div
                            variants={fadeInUp}
                            className="grid grid-cols-1 lg:grid-cols-3 border-t border-b border-secret-gold/40 divide-y lg:divide-y-0 lg:divide-x divide-secret-gold/40"
                        >
                            {[
                                {
                                    id: "01",
                                    label: "GỐC RỄ",
                                    content: "Cuộc sống bên ngoài phản ánh trạng thái bên trong."
                                },
                                {
                                    id: "02",
                                    label: "BỀN VỮNG",
                                    content: "Không có sự thay đổi bền vững nếu không chuyển hóa từ gốc."
                                },
                                {
                                    id: "03",
                                    label: "TỰ NHIÊN",
                                    content: "Mỗi người đều có nhịp phát triển riêng – không ép, không gồng."
                                }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                    className="p-8 lg:px-12 lg:py-12 group transition-colors duration-300"
                                >
                                    <div className="flex flex-col gap-4 text-left">
                                        <span className="font-sans text-xs font-bold text-secret-gold tracking-widest group-hover:text-secret-paper transition-colors duration-300">
                                            {item.id}. {item.label}
                                        </span>
                                        <p className="font-sans font-light text-xl text-gray-200 leading-relaxed">
                                            {item.content}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* 4. Footer Quote */}
                        <motion.div variants={fadeInUp} className="mt-20 flex items-center justify-center gap-6">
                            <div className="w-12 h-[1px] bg-secret-gold/30 hidden md:block"></div>
                            <p className="font-sans italic text-secret-gold/80 text-center max-w-[80%] mx-auto text-balance leading-relaxed">
                                "Mong Coaching tin rằng: Khi nội tâm đủ vững, hành động sẽ đúng, và kết quả tài chính sẽ tự nhiên đến."
                            </p>
                            <div className="w-12 h-[1px] bg-secret-gold/30 hidden md:block"></div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Section 4 & 5: Lĩnh Vực & Phong Cách - The Royal Frame Redesign */}
            <section className="bg-secret-paper py-24">
                <div className="container mx-auto px-4 max-w-6xl">

                    {/* Content Wrapper with soft white background */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-white/40 rounded-3xl p-8 md:p-12 lg:p-16 backdrop-blur-sm"
                    >

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">

                            {/* Cột Trái: Lĩnh Vực Dẫn Dắt */}
                            <div className="space-y-8">
                                <div>
                                    <h2 className="font-serif text-3xl md:text-4xl text-secret-ink font-bold mb-3">
                                        Lĩnh Vực Dẫn Dắt
                                    </h2>
                                    <div className="w-20 h-1 bg-secret-gold rounded-full"></div>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        "Huấn luyện Tiềm Thức & Luật Hấp Dẫn ứng dụng",
                                        "Chuyển hóa niềm tin tài chính và cảm xúc gốc rễ",
                                        "Khơi thông dòng tiền và mục tiêu tài chính",
                                        "Đồng hành nội tâm cho người kinh doanh",
                                        "Thiền dẫn – thực hành kết nối nội tâm"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3 group cursor-default">
                                            <CheckCircle className="w-6 h-6 text-secret-wax flex-shrink-0 mt-0.5" />
                                            <p className="font-sans font-medium text-lg text-secret-ink leading-relaxed group-hover:text-secret-wax transition-colors duration-300">
                                                {item}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cột Phải: Phong Cách Dẫn Dắt */}
                            <div className="space-y-8">
                                <div>
                                    <h2 className="font-serif text-3xl md:text-4xl text-secret-ink font-bold mb-3">
                                        Phong Cách Dẫn Dắt
                                    </h2>
                                    <div className="w-20 h-1 bg-secret-gold rounded-full"></div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { title: "Gần Gũi", desc: "Không giáo điều, sáo rỗng.", icon: Heart },
                                        { title: "Nói Thật", desc: "Không tô hồng thực tế.", icon: Flame },
                                        { title: "Thực Tế", desc: "Từ trải nghiệm đã đi qua.", icon: Key },
                                        { title: "Sâu Sắc", desc: "Đi vào gốc rễ vấn đề.", icon: Quote },
                                    ].map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white p-6 rounded-xl shadow-md flex items-start gap-4 hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-secret-gold transition-all duration-300 cursor-default"
                                        >
                                            <item.icon className="w-6 h-6 text-secret-wax flex-shrink-0 mt-1" />
                                            <div>
                                                <h4 className="font-serif font-bold text-lg text-secret-ink mb-1">
                                                    {item.title}
                                                </h4>
                                                <p className="font-sans text-sm text-gray-600 leading-relaxed">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </motion.div>

                    {/* Footer Quote - Styled Box */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="mt-12 bg-secret-wax/10 rounded-2xl p-8 text-center max-w-4xl mx-auto"
                    >
                        <p className="font-sans italic text-lg md:text-xl text-secret-wax font-semibold leading-relaxed">
                            "Mong Coaching không đứng ở vị trí 'dạy bảo', <br className="hidden md:block" />
                            mà là người đi trước, chia sẻ lại con đường đã đi qua."
                        </p>
                    </motion.div>

                </div>
            </section>

            {/* Section 6: Đối Tượng */}
            <section className="py-24 bg-white border-y border-gray-100">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="text-center mb-16"
                    >
                        <motion.h2 variants={fadeInUp} className="font-serif text-4xl md:text-5xl text-secret-ink mb-4">Ai cần sự đồng hành này?</motion.h2>
                        <motion.div variants={fadeInUp} className="w-16 h-1 bg-secret-wax mx-auto rounded-full"></motion.div>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {[
                            "Người đang bế tắc tài chính",
                            "Người kinh doanh gặp khó khăn kéo dài",
                            "Chủ doanh nghiệp chịu áp lực tiền bạc",
                            "Người muốn chữa lành mối quan hệ với tiền",
                            "Người tìm kiếm sự phát triển bền vững"
                        ].slice(0, 4).map((item, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeInUp}
                                whileHover={{ y: -5 }}
                                className="p-8 border border-secret-gold/30 bg-secret-paper/20 rounded-sm text-center flex flex-col items-center gap-4 group hover:bg-white hover:shadow-lg transition-all duration-300"
                            >
                                <div className="w-12 h-12 bg-secret-ink text-secret-paper rounded-full flex items-center justify-center font-serif font-bold text-xl group-hover:bg-secret-wax transition-colors">
                                    {idx + 1}
                                </div>
                                <h4 className="font-semibold text-lg text-slate-800">{item}</h4>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Section 7 & 8: Vai trò & Thông điệp - Mong Brand Card */}
            <section className="py-24 bg-white relative">
                <div className="container mx-auto px-6 flex justify-center">

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative w-full max-w-3xl bg-secret-paper text-secret-ink px-8 py-20 md:px-12 md:py-24 text-center shadow-xl shadow-secret-dark/15 border border-secret-gold/30"
                    >
                        {/* Corner Ornaments */}
                        <div className="absolute top-5 left-5 w-5 h-5 border-t-2 border-l-2 border-secret-gold opacity-60"></div>
                        <div className="absolute top-5 right-5 w-5 h-5 border-t-2 border-r-2 border-secret-gold opacity-60"></div>
                        <div className="absolute bottom-5 left-5 w-5 h-5 border-b-2 border-l-2 border-secret-gold opacity-60"></div>
                        <div className="absolute bottom-5 right-5 w-5 h-5 border-b-2 border-r-2 border-secret-gold opacity-60"></div>

                        {/* Kicker */}
                        <div className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-secret-wax mb-3">
                            VAI TRÒ TẠI MALI EDU
                        </div>

                        {/* Role with Underline */}
                        <div className="mb-10">
                            <div className="font-sans text-sm font-light text-secret-dark/80 inline-block">
                                Người sáng lập & Dẫn dắt nội dung chuyên môn
                            </div>
                            <div className="w-10 h-px bg-secret-gold mx-auto mt-4"></div>
                        </div>

                        {/* Quote */}
                        <blockquote className="font-serif text-2xl md:text-3xl font-normal text-secret-ink leading-snug mb-8">
                            "Bạn không thiếu năng lực.<br />
                            Bạn chỉ đang vận hành cuộc sống<br />
                            từ những niềm tin và cảm xúc cũ."
                        </blockquote>

                        {/* Description */}
                        <p className="font-sans font-light text-base text-secret-ink leading-relaxed max-w-xl mx-auto mb-12">
                            Và nếu bạn sẵn sàng nhìn lại, hiểu lại và đi đúng hướng, <br className="hidden md:block" />
                            bạn hoàn toàn có thể thay đổi.
                        </p>

                        {/* Signature Button */}
                        <div className="inline-block">
                            <span className="font-serif text-2xl font-bold italic text-secret-wax border-2 border-secret-wax px-8 py-3 tracking-wider transition-all duration-300 hover:bg-secret-wax hover:text-secret-paper cursor-pointer select-none">
                                Mong Coaching
                            </span>
                        </div>

                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default MongCoaching;
