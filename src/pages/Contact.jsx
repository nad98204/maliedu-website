import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Contact = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        message: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        setTimeout(() => {
            alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
            setFormData({ fullName: '', phone: '', email: '', message: '' });
            setIsSubmitting(false);
        }, 1000);
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const contactInfo = [
        {
            icon: MapPin,
            label: 'Địa chỉ',
            value: '125 Hoàng Quốc Việt, Nghĩa Đô, Cầu Giấy, Hà Nội'
        },
        {
            icon: Phone,
            label: 'Hotline',
            value: '0355 067 656'
        },
        {
            icon: Mail,
            label: 'Email',
            value: 'support@maliedu.com'
        }
    ];

    const faqItems = [
        "Làm sao để đăng ký khóa học?",
        "Mali Edu có khóa học Online không?",
        "Tôi có thể gặp trực tiếp Mong Coaching không?"
    ];

    return (
        <div className="bg-white font-sans overflow-hidden">
            <Helmet>
                <title>Liên hệ tư vấn - Mali Edu</title>
            </Helmet>
            {/* HERO SECTION */}
            <section className="bg-secret-paper pt-20 pb-12">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="container mx-auto px-4 text-center"
                >
                    <motion.div variants={fadeInUp}>
                        <span className="font-sans tracking-widest text-secret-wax text-xs uppercase font-bold">
                            KẾT NỐI VỚI MALI EDU
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={fadeInUp}
                        className="font-serif text-5xl md:text-6xl text-secret-ink mt-6 mb-4 font-bold"
                    >
                        Chúng tôi ở đây để lắng nghe bạn
                    </motion.h1>

                    <motion.p
                        variants={fadeInUp}
                        className="font-sans text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
                    >
                        Dù bạn đang tìm kiếm lộ trình học tập hay cần tư vấn chuyên sâu, hãy để lại lời nhắn.
                    </motion.p>
                </motion.div>
            </section>

            {/* MAIN CONTENT - SPLIT LAYOUT */}
            <section className="py-20 bg-white">
                <div className="container max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                        {/* CỘT TRÁI: Thông tin & Bản đồ */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="space-y-10"
                        >
                            {/* Info Block */}
                            <div className="space-y-8">
                                {contactInfo.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-4 group">
                                        <div className="w-12 h-12 bg-secret-wax rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-secret-ink transition-colors duration-300">
                                            <item.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <div className="font-sans text-sm text-secret-wax font-semibold tracking-wide uppercase mb-1">
                                                {item.label}
                                            </div>
                                            <div className="font-sans text-lg text-secret-ink leading-relaxed">
                                                {item.value}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Map Container */}
                            <div className="h-64 w-full rounded-2xl overflow-hidden shadow-inner bg-gray-100 relative border border-gray-200">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.657819476948!2d105.79568331476282!3d21.048800992304773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab0d127a01e1%3A0x632e1db0e374c443!2zMTI1IEhvw6BuZyBRdeG7kWMgVmnhu4d0LCBOZ2jEqWEgxJDDtCwgQ-G6p3UgR2nhuqV5LCBIw6AgTuG7mWk!5e0!3m2!1svi!2s!4v1650000000000!5m2!1svi!2s&style=feature:all|element:all|saturation:-100|lightness:20"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, filter: 'grayscale(100%)' }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Mali Edu Location"
                                />
                            </div>
                        </motion.div>

                        {/* CỘT PHẢI: Form Tư Vấn */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="bg-white p-10 rounded-2xl shadow-xl border border-secret-gold/20"
                        >
                            <h3 className="font-serif text-3xl text-secret-ink font-bold mb-2">
                                Gửi lời nhắn cho chúng tôi
                            </h3>
                            <p className="font-sans text-gray-600 mb-8">
                                Điền thông tin và chúng tôi sẽ liên hệ với bạn sớm nhất.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Họ tên */}
                                <div>
                                    <label htmlFor="fullName" className="block font-sans text-sm font-semibold text-secret-ink mb-2">
                                        Họ và tên <span className="text-secret-wax">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border-b-2 border-gray-200 focus:border-secret-wax focus:bg-white transition-all duration-300 outline-none font-sans text-secret-ink"
                                        placeholder="Nhập họ và tên của bạn"
                                    />
                                </div>

                                {/* Số điện thoại */}
                                <div>
                                    <label htmlFor="phone" className="block font-sans text-sm font-semibold text-secret-ink mb-2">
                                        Số điện thoại <span className="text-secret-wax">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border-b-2 border-gray-200 focus:border-secret-wax focus:bg-white transition-all duration-300 outline-none font-sans text-secret-ink"
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block font-sans text-sm font-semibold text-secret-ink mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border-b-2 border-gray-200 focus:border-secret-wax focus:bg-white transition-all duration-300 outline-none font-sans text-secret-ink"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                {/* Nội dung */}
                                <div>
                                    <label htmlFor="message" className="block font-sans text-sm font-semibold text-secret-ink mb-2">
                                        Nội dung cần hỗ trợ
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full px-4 py-3 bg-gray-50 border-b-2 border-gray-200 focus:border-secret-wax focus:bg-white transition-all duration-300 outline-none font-sans text-secret-ink resize-none"
                                        placeholder="Hãy cho chúng tôi biết bạn cần hỗ trợ gì..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-secret-wax text-white font-sans font-bold py-4 rounded-lg hover:bg-secret-ink transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Đang gửi...' : 'Gửi lời nhắn'}
                                </button>
                            </form>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="py-20 bg-secret-paper/40">
                <div className="container max-w-6xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <h2 className="font-serif text-3xl md:text-4xl text-secret-ink font-bold">
                            Câu hỏi thường gặp
                        </h2>
                        <div className="w-16 h-1 bg-secret-wax mx-auto mt-4 rounded-full"></div>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {faqItems.map((question, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeInUp}
                                whileHover={{ y: -5 }}
                                className="bg-white/60 backdrop-blur-sm p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-secret-gold/10"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-secret-wax/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="font-serif font-bold text-secret-wax">?</span>
                                    </div>
                                    <p className="font-sans text-secret-ink leading-relaxed flex-1">
                                        {question}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
