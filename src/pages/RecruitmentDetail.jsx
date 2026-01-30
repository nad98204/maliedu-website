import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Briefcase, Clock, MapPin, DollarSign, Calendar, Upload, Send, CheckCircle, ArrowLeft, Info } from "lucide-react";

const RecruitmentDetail = () => {
    const { id } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        cvFile: null,
    });

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchJob = async () => {
            try {
                const docRef = doc(db, "jobs", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setJob({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.error("No such document!");
                }
            } catch (error) {
                console.error("Error fetching job:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchJob();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev) => ({ ...prev, cvFile: e.target.files[0] }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would implement the actual submission logic (e.g., upload file to storage, save application to Firestore)
        console.log("Application Submitted:", { jobTitle: job?.title, ...formData });
        alert("Cảm ơn bạn đã nộp hồ sơ! Chúng tôi sẽ liên hệ sớm.");
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang tải thông tin...</div>;
    }

    if (!job) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-xl text-slate-600">Không tìm thấy vị trí tuyển dụng này.</p>
                <Link to="/tuyen-dung" className="text-secret-wax hover:underline">Quay lại danh sách</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFBF0] font-inter text-slate-800 pb-20">
            {/* 1. HEADER - BRAND GRADIENT */}
            <div className="bg-gradient-to-br from-[#B91C1C] to-[#991B1B] text-white py-16 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                    <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#FFFFFF" d="M45.7,-70.5C58.9,-62.5,69.3,-49.4,75.9,-34.7C82.5,-20,85.4,-3.7,81.6,11.2C77.8,26.1,67.3,39.6,55.5,50.7C43.6,61.8,30.5,70.5,16.2,74.1C1.9,77.7,-13.6,76.2,-28.1,70.5C-42.6,64.8,-56.1,54.9,-66.4,42.2C-76.7,29.5,-83.8,14,-82.5,-0.7C-81.2,-15.5,-71.5,-29.4,-60.1,-40.7C-48.7,-52,-35.6,-60.7,-21.8,-68.2C-8,-75.7,6.5,-82,20.5,-80.4C34.5,-78.8,48,-69.3,45.7,-70.5Z" transform="translate(100 100)" />
                    </svg>
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <Link to="/tuyen-dung" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại danh sách
                    </Link>

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-wrap gap-3">
                            <span className="bg-white text-[#B91C1C] px-3 py-1 rounded font-bold text-sm shadow-sm uppercase tracking-wider">
                                {job.category || "Tuyển dụng"}
                            </span>
                            {job.isHot && (
                                <span className="bg-yellow-400 text-[#991B1B] px-3 py-1 rounded font-bold text-sm shadow-sm animate-pulse">
                                    HOT POSITION
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold font-serif text-yellow-50 drop-shadow-md leading-tight">
                            {job.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-white/90 font-medium text-base">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-yellow-400" />
                                <span>{job.salary || "Thỏa thuận"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-400" />
                                <span>{job.jobType || "Full-time"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-yellow-400" />
                                <span>Hạn nộp: {job.deadline ? new Date(job.deadline).toLocaleDateString("vi-VN") : "Đang mở"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-yellow-400" />
                                <span>Hà Nội</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. BODY CONTENT */}
            <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: DESCRIPTION (65-70%) */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 md:p-10 border-t-4 border-[#B91C1C]">
                            <h2 className="text-2xl font-bold text-[#B91C1C] mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                                <Briefcase className="w-6 h-6" />
                                Mô tả công việc
                            </h2>
                            <div
                                className="content-display"
                                dangerouslySetInnerHTML={{ __html: job.description || "<p>Chưa có nội dung mô tả chi tiết.</p>" }}
                            />
                        </div>

                        {/* 2.2 ABOUT MALI EDU (NEW SECTION) */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-secret-wax/5 p-8 md:p-10 border-t-4 border-secret-gold">
                            <h2 className="text-2xl font-bold text-secret-wax mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                                <Info className="w-6 h-6" />
                                Về MALI EDU
                            </h2>
                            <div className="space-y-4 text-slate-600 leading-relaxed text-justify">
                                <p>
                                    <strong className="text-secret-ink">Mali Edu</strong> là Hệ sinh thái Giáo dục & Huấn luyện phát triển tiềm năng con người hàng đầu, bao gồm: Tổ chức huấn luyện Mong Coaching; Cộng đồng thực hành chuyên sâu về Luật Hấp Dẫn & Sức Mạnh Tiềm Thức; Các dự án đào tạo kinh doanh thực chiến (Sales, Marketing) và Chữa lành Tâm thức.
                                </p>
                                <p>
                                    Với tôn chỉ hoạt động <strong className="text-secret-wax">"Tâm – Tầm – Tài"</strong>, Mali Edu luôn tiên phong trong việc kết hợp giữa Tư duy gốc rễ (Mindset) và Kỹ năng thực chiến (Skillset). Chúng tôi tự hào đã đào tạo và chuyển hóa cho hàng nghìn học viên, giúp vô số cá nhân và gia đình tìm lại sự cân bằng, hạnh phúc và thịnh vượng tài chính. Tại Mali Edu, văn hóa <span className="italic">"Phụng sự, Kỷ luật và Học tập trọn đời"</span> chính là lợi thế cạnh tranh cốt lõi.
                                </p>
                                <p>
                                    <strong>Tầm nhìn đến năm 2030</strong>, Mali Edu định hướng trở thành Top 10 Tổ chức huấn luyện và đầu tư giáo dục uy tín nhất, kiến tạo cộng đồng thịnh vượng và hạnh phúc lớn mạnh tại Việt Nam.
                                </p>

                                <div className="mt-6 p-6 bg-secret-paper/50 rounded-xl border border-secret-wax/10">
                                    <h3 className="font-bold text-lg text-secret-ink mb-3">Tại sao bạn nên gia nhập Mali Edu?</h3>
                                    <p className="mb-3">
                                        Mali Edu tự hào sở hữu đội ngũ nhân sự "Thiện chiến & Tận tâm". Làm việc tại đây, bạn được thụ hưởng đặc quyền:
                                    </p>
                                    <ul className="space-y-2 list-disc pl-5 marker:text-secret-wax">
                                        <li>Được trực tiếp <strong>Nhà huấn luyện (Trainer) Mong Coaching</strong> đào tạo về Tư duy, Luật Hấp Dẫn.</li>
                                        <li>Tiếp cận chiến lược <strong>Marketing & Kinh doanh thực chiến</strong> mới nhất.</li>
                                        <li>Cơ hội <strong>kết nối (Network)</strong> với cộng đồng doanh nhân và nhà đầu tư chất lượng.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* RIGHT COLUMN: STICKY FORM (30-35%) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-6 md:p-8 border-t-4 border-yellow-400">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-[#B91C1C] uppercase mb-1">Ứng tuyển ngay</h3>
                                    <p className="text-sm text-slate-500">Điền thông tin để gia nhập đội ngũ Mali Edu</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] outline-none transition-all"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] outline-none transition-all"
                                            placeholder="0912 345 678"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C] outline-none transition-all"
                                            placeholder="example@gmail.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">CV / Hồ sơ <span className="text-red-500">*</span></label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-white hover:border-[#B91C1C] transition-all cursor-pointer relative group">
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                required
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="flex flex-col items-center justify-center text-gray-500 group-hover:text-[#B91C1C]">
                                                {formData.cvFile ? (
                                                    <>
                                                        <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
                                                        <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{formData.cvFile.name}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 mb-2" />
                                                        <span className="text-sm font-medium">Tải lên CV (PDF/DOC)</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 rounded-xl bg-[#B91C1C] text-white font-bold text-lg shadow-lg shadow-red-900/20 hover:bg-[#991B1B] transition-all transform hover:-translate-y-1 mt-2 flex items-center justify-center gap-2"
                                    >
                                        <Send className="w-5 h-5" />
                                        GỬI HỒ SƠ NGAY
                                    </button>
                                    <p className="text-center text-xs text-slate-400 mt-3">
                                        Bằng việc gửi thông tin, bạn đồng ý với chính sách tuyển dụng của Mali Edu.
                                    </p>
                                </form>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <h3 className="text-lg font-bold text-[#B91C1C] mb-4">Lưu ý khi ứng tuyển</h3>
                                <ul className="space-y-3 text-sm text-slate-600">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                        <span>Ứng viên vui lòng đọc kỹ mô tả công việc (JD) trước khi nộp hồ sơ.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                        <span>Chuẩn bị CV chuyên nghiệp, tập trung vào kinh nghiệm liên quan.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                        <span>Mali Edu sẽ liên hệ với ứng viên phù hợp trong vòng 3-5 ngày làm việc.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecruitmentDetail;
