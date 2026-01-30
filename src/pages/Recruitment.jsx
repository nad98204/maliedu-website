import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Briefcase, CheckCircle, ChevronDown, Clock, MapPin, Send, Upload, User, Users } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

const Recruitment = () => {
    const location = useLocation();
    const formRef = useRef(null);

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState("");
    const [filterLevel, setFilterLevel] = useState("");
    const [filterDept, setFilterDept] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        position: "",
        cvFile: null,
    });

    // Fetch jobs from Firebase
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // DEBUG: Fetch ALL jobs to verify connection, ignore filter for a moment
                // const q = query(collection(db, "jobs"), where("isPublished", "==", true));
                const q = query(collection(db, "jobs"));
                const querySnapshot = await getDocs(q);
                const jobsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log("Fetched jobs:", jobsData);
                setJobs(jobsData);
            } catch (error) {
                console.error("Error fetching jobs:", error);
                setErrorMsg(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    // Derived list of all available job titles for dropdown
    const allJobs = jobs.map(j => j.title);

    // Group jobs by category for the list view
    const groupedJobs = jobs.reduce((acc, job) => {
        const cat = job.category || "Khác";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(job);
        return acc;
    }, {});

    // Sort function: HOT first -> Available -> Full
    const sortJobs = (jobList) => {
        return [...jobList].sort((a, b) => {
            // Priority 1: HOT
            if (a.isHot && !b.isHot) return -1;
            if (!a.isHot && b.isHot) return 1;

            const remainingA = Math.max(0, (a.targetCount || 1) - (a.hiredCount || 0));
            const remainingB = Math.max(0, (b.targetCount || 1) - (b.hiredCount || 0));

            // Priority 2: Availability (jobs with remaining spot first)
            if (remainingA > 0 && remainingB === 0) return -1;
            if (remainingA === 0 && remainingB > 0) return 1;

            // Priority 3: Creation date (newest first) - assuming implicit order or string comparison if needed
            return 0;
        });
    };

    // Filter jobs based on Hero search
    // Note: The Hero filters currently don't filter the LIST below, they just set visual state
    // But we could implement filtering if requested. For now, we follow the "Scroll to List" behavior.

    // Handle query param on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const roleParam = params.get("role");
        // We only pre-fill if we have jobs loaded and the role exists
        if (roleParam && jobs.length > 0 && jobs.some(j => j.title === roleParam)) {
            setSelectedPosition(roleParam);
            setFormData((prev) => ({ ...prev, position: roleParam }));
            if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }
    }, [location.search, jobs]);

    // Handle position change from Hero or Job List
    const handlePositionSelect = (position) => {
        // Only select if not full? The UI button prevents clicking if full.
        setSelectedPosition(position);
        setFormData((prev) => ({ ...prev, position }));
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleHeroSubmit = () => {
        // If user selected a position in Hero, use it
        // But the Hero 'select' is bound to 'selectedPosition'
        // For now, simpler behavior: Scroll to Job List
        const jobListSection = document.getElementById("job-list-section");
        if (jobListSection) {
            jobListSection.scrollIntoView({ behavior: "smooth" });
        }
    };

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
        console.log("Form Data Submitted:", formData);
        alert("Cảm ơn bạn đã ứng tuyển! Chúng tôi sẽ liên hệ sớm.");
        // Reset form or redirect logic here
    };

    return (
        <div className="min-h-screen bg-white font-inter text-slate-800">
            {/* 1. HERO SECTION (REDESIGN HBR STYLE) */}
            <section className="relative h-[600px] flex items-center justify-center px-4 overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                        alt="Office Teamwork"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60"></div>
                </div>

                <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
                    {/* Headline */}
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-12 tracking-tight uppercase drop-shadow-lg font-inter flex flex-col items-center gap-[6px]">
                        <span>MALI EDU - TRẢI THẢM ĐỎ,</span>
                        <span>ĐÓN NHÂN TÀI!</span>
                    </h1>

                    {/* Search Bar Container */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 md:p-6 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Column 1: Level Dropdown */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-secret-wax transition-colors" />
                                </div>
                                <select
                                    className="block w-full pl-10 pr-10 py-4 text-base border border-gray-200 rounded-xl bg-gray-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax appearance-none cursor-pointer hover:bg-white transition-colors"
                                    value={filterLevel}
                                    onChange={(e) => setFilterLevel(e.target.value)}
                                >
                                    <option value="">Chọn Cấp Bậc</option>
                                    <option value="Thực tập sinh / CTV">Thực tập sinh / CTV</option>
                                    <option value="Nhân viên">Nhân viên</option>
                                    <option value="Trưởng nhóm / Team Leader">Trưởng nhóm / Team Leader</option>
                                    <option value="Quản lý / Trưởng phòng">Quản lý / Trưởng phòng</option>
                                    <option value="Giám đốc bộ phận">Giám đốc bộ phận</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Column 2: Department Dropdown */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Briefcase className="h-5 w-5 text-gray-400 group-focus-within:text-secret-wax transition-colors" />
                                </div>
                                <select
                                    className="block w-full pl-10 pr-10 py-4 text-base border border-gray-200 rounded-xl bg-gray-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax appearance-none cursor-pointer hover:bg-white transition-colors"
                                    value={filterDept}
                                    onChange={(e) => setFilterDept(e.target.value)}
                                >
                                    <option value="">Chọn Phòng Ban</option>
                                    <option value="Phòng Kinh Doanh">Phòng Kinh Doanh (Sales)</option>
                                    <option value="Phòng Marketing">Phòng Marketing & Truyền thông</option>
                                    <option value="Phòng Đào tạo">Phòng Đào tạo & Sản phẩm</option>
                                    <option value="Phòng Nhân sự">Phòng Hành chính - Nhân sự</option>
                                    <option value="Phòng Công nghệ">Phòng Công nghệ & Kỹ thuật</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Column 3: Action Button */}
                            <button
                                onClick={handleHeroSubmit}
                                className="w-full h-full min-h-[56px] bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:translate-y-0"
                            >
                                <span className="uppercase tracking-wide">Ứng tuyển ngay</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. ABOUT US (SHORT) */}
            <section className="py-16 md:py-24 px-4 bg-orange-50/60">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-secret-ink mb-6">Về Mali Edu</h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Mali Edu là đơn vị đào tạo và huấn luyện phát triển bản thân, tập trung vào tiềm thức, nội tâm và tài chính.
                        Chúng tôi xây dựng đội ngũ dựa trên kỷ luật, trách nhiệm và phát triển bền vững.
                    </p>
                </div>
            </section>

            {/* 3. CULTURE & VALUES */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-center text-3xl font-bold text-secret-ink mb-12">Văn Hóa & Giá Trị</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <User className="w-10 h-10 text-secret-wax mb-4" />
                            <h3 className="text-xl font-bold mb-3 text-secret-ink">Trung thực & Trách nhiệm</h3>
                            <p className="text-slate-600">Tại Mali Edu, chúng tôi đề cao sự trung thực, tinh thần học hỏi và trách nhiệm tuyệt đối với kết quả công việc.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <Users className="w-10 h-10 text-secret-wax mb-4" />
                            <h3 className="text-xl font-bold mb-3 text-secret-ink">Sẻ chia & Đồng hành</h3>
                            <p className="text-slate-600">Văn hóa làm việc và giá trị cốt lõi sẽ được chia sẻ chi tiết hơn trong quá trình tuyển dụng để tìm ra những người đồng đội phù hợp nhất.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. BENEFITS (BRIEF) */}
            <section className="py-16 px-4 bg-secret-ink text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6">Quyền Lợi & Chế Độ</h2>
                    <p className="text-lg text-white/80 leading-relaxed mb-8">
                        Mali Edu có đầy đủ các chế độ cơ bản theo quy định, cùng chính sách thu nhập, thưởng và đào tạo phù hợp với từng vị trí.
                        Chi tiết sẽ được trao đổi trực tiếp trong buổi phỏng vấn.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="bg-white/10 px-4 py-2 rounded-full text-sm font-medium">Thu nhập hấp dẫn</div>
                        <div className="bg-white/10 px-4 py-2 rounded-full text-sm font-medium">Đào tạo chuyên sâu</div>
                        <div className="bg-white/10 px-4 py-2 rounded-full text-sm font-medium">Lộ trình thăng tiến</div>
                    </div>
                </div>
            </section>

            {/* 5. ENVIRONMENT (SHORT) */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-secret-ink mb-6">Môi Trường Làm Việc</h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Môi trường làm việc rõ ràng, kỷ luật, đề cao hiệu quả và tinh thần đồng đội.
                        Phù hợp với những người muốn phát triển lâu dài, không phù hợp với tư duy làm việc hời hợt.
                    </p>
                </div>
            </section>

            {/* 6. JOB LIST (HBR STYLE TABLE) */}
            <section id="job-list-section" className="py-20 px-4 bg-gradient-to-br from-[#1e1b4b] to-[#312e81]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center text-white mb-16 uppercase tracking-wider">
                        Danh sách vị trí tuyển dụng
                    </h2>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl min-h-[200px]">
                        {loading && (
                            <div className="text-center py-20 text-white font-bold text-xl">Đang tải dữ liệu...</div>
                        )}

                        {errorMsg && (
                            <div className="text-center py-20 text-red-500 font-bold bg-white/90">
                                Lỗi kết nối: {errorMsg}
                            </div>
                        )}

                        {!loading && !errorMsg && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-white border-separate border-spacing-0">
                                    <thead className="bg-white/5 uppercase text-sm font-bold text-white/60 tracking-wider">
                                        <tr className="hidden md:table-row">
                                            <th className="py-6 px-6 font-semibold">Vị trí tuyển dụng</th>
                                            <th className="py-6 px-4 font-semibold w-[20%]">Mức lương</th>
                                            <th className="py-6 px-4 font-semibold w-[15%]">Hạn nộp</th>
                                            <th className="py-6 px-6 font-semibold w-[15%] text-right">Ứng tuyển</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10 md:divide-y-0">
                                        {jobs.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="py-12 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-white/60">
                                                        <span className="text-xl">📭</span>
                                                        <span>Chưa tìm thấy vị trí tuyển dụng nào.</span>
                                                        <span className="text-sm opacity-50">(Dữ liệu: {jobs.length} bản ghi)</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            sortJobs(jobs).map((job) => {
                                                const remaining = Math.max(0, (job.targetCount || 1) - (job.hiredCount || 0));
                                                // Check deadline
                                                const hasDeadline = job.deadline;
                                                const isExpired = hasDeadline ? new Date(job.deadline) < new Date() : false;

                                                const isFull = remaining <= 0;
                                                const isClosed = isFull || isExpired;

                                                const statusText = isExpired ? "Đã hết hạn" : (isFull ? "Đã đủ nhân sự" : "Ứng tuyển ngay");

                                                return (
                                                    <tr
                                                        key={job.id}
                                                        className={`group transition-colors relative block md:table-row ${isClosed ? "bg-white/5 opacity-60" : "hover:bg-white/5"
                                                            }`}
                                                    >
                                                        {/* INFO COLUMN */}
                                                        <td className="py-6 px-6 block md:table-cell border-b border-white/5 md:border-b-0">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-3">
                                                                    {job.isHot && !isClosed && (
                                                                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg shadow-red-600/40 animate-pulse">
                                                                            HOT
                                                                        </span>
                                                                    )}
                                                                    <Link to={`/tuyen-dung/${job.id}`} className={`text-lg md:text-xl font-bold uppercase tracking-wide transition-colors block hover:underline ${job.isHot && !isClosed ? 'text-yellow-400 group-hover:text-yellow-300' : 'text-white'
                                                                        }`}>
                                                                        {job.title}
                                                                    </Link>
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Briefcase className="w-4 h-4" />
                                                                        <span>{job.category}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Users className="w-4 h-4" />
                                                                        <span>Số lượng: {job.targetCount}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock className="w-4 h-4" />
                                                                        <span>{job.jobType || "Full-time"}</span>
                                                                    </div>
                                                                    {/* Mobile only Salary/Deadline show here for better layout */}
                                                                    <div className="md:hidden flex items-center gap-1.5 text-yellow-500/90">
                                                                        <span>Lương: {job.salary || 'Thỏa thuận'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* SALARY COLUMN */}
                                                        <td className="py-6 px-4 hidden md:table-cell align-middle">
                                                            <span className="text-yellow-200/90 font-medium whitespace-nowrap">
                                                                {job.salary || 'Thỏa thuận'}
                                                            </span>
                                                        </td>

                                                        {/* DEADLINE COLUMN */}
                                                        <td className="py-6 px-4 hidden md:table-cell align-middle">
                                                            {job.deadline ? (
                                                                <span className={`font-medium ${isExpired ? 'text-red-400' : 'text-white/80'}`}>
                                                                    {new Date(job.deadline).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-white/40 italic">--</span>
                                                            )}
                                                        </td>

                                                        {/* ACTION COLUMN */}
                                                        <td className="py-6 px-6 block md:table-cell align-middle text-right md:border-b-0">
                                                            <div className="flex justify-between md:justify-end items-center w-full">
                                                                {/* Mobile Deadline label */}
                                                                <div className="md:hidden text-sm text-white/50">
                                                                    {job.deadline && `Hạn: ${new Date(job.deadline).toLocaleDateString('vi-VN')}`}
                                                                </div>

                                                                <Link
                                                                    to={`/tuyen-dung/${job.id}`}
                                                                    className={`flex items-center justify-center px-6 py-2.5 rounded-lg font-bold text-sm transition-all transform shrink-0 ml-auto md:ml-0 ${isClosed
                                                                        ? "bg-white/10 text-white/40 cursor-not-allowed pointer-events-none"
                                                                        : "bg-white text-[#1e1b4b] hover:bg-yellow-400 hover:text-[#1e1b4b] hover:-translate-y-1 shadow-lg shadow-white/10"
                                                                        }`}
                                                                >
                                                                    {statusText}
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 7. RECRUITMENT PROCESS */}
            <section className="py-16 px-4 bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-secret-ink mb-12">Quy Trình Tuyển Dụng</h2>
                    <div className="flex flex-col md:flex-row justify-between items-center relative gap-8">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>

                        {[
                            { step: "01", title: "Ứng tuyển" },
                            { step: "02", title: "Sàng lọc" },
                            { step: "03", title: "Phỏng vấn" },
                            { step: "04", title: "Kết quả" }
                        ].map((item, index) => (
                            <div key={index} className="flex flex-col items-center bg-white p-4 z-10 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-full bg-secret-wax text-white flex items-center justify-center font-bold text-lg mb-3 shadow-lg shadow-secret-wax/20">
                                    {item.step}
                                </div>
                                <h4 className="font-semibold text-secret-ink">{item.title}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. FIT / NOT FIT */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border-l-4 border-green-500">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-secret-ink">
                                <CheckCircle className="text-green-500" />
                                Ai phù hợp?
                            </h3>
                            <p className="text-slate-600">Phù hợp với người có trách nhiệm, kỷ luật cao, tinh thần ham học hỏi và mong muốn phát triển sự nghiệp lâu dài, bền vững.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border-l-4 border-red-500">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-secret-ink">
                                <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center text-xs text-red-500 font-bold">X</div>
                                Ai KHÔNG phù hợp?
                            </h3>
                            <p className="text-slate-600">Không phù hợp với người thiếu cam kết, tư duy làm việc hời hợt, chỉ tìm kiếm công việc tạm thời hoặc không chịu được áp lực phát triển.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. FAQ */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-secret-ink mb-10">Câu Hỏi Thường Gặp</h2>
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-xl">
                            <h4 className="font-bold text-secret-ink mb-2">Có đào tạo cho người mới không?</h4>
                            <p className="text-slate-600">Có. Chúng tôi luôn chú trọng đào tạo và phát triển nhân sự.</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl">
                            <h4 className="font-bold text-secret-ink mb-2">Có làm full-time / part-time không?</h4>
                            <p className="text-slate-600">Tùy từng vị trí sẽ có yêu cầu cụ thể về thời gian làm việc.</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl">
                            <h4 className="font-bold text-secret-ink mb-2">Làm việc online hay offline?</h4>
                            <p className="text-slate-600">Sẽ được trao đổi cụ thể khi phỏng vấn tùy theo tính chất công việc.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 10. APPLICATION FORM */}
            <section ref={formRef} id="application-form" className="py-24 px-4 bg-secret-ink relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    {/* Decorative patterns can go here */}
                </div>

                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ứng Tuyển Ngay</h2>
                        <p className="text-white/80 text-lg">Điền thông tin của bạn để bắt đầu hành trình cùng Mali Edu.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Họ và tên *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 outline-none transition-all bg-gray-50"
                                    placeholder="Nguyễn Văn A"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Số điện thoại *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 outline-none transition-all bg-gray-50"
                                    placeholder="0912 345 678"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 outline-none transition-all bg-gray-50"
                                placeholder="example@gmail.com"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Vị trí ứng tuyển *</label>
                            <div className="relative">
                                <select
                                    name="position"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 outline-none transition-all bg-gray-50 appearance-none cursor-pointer"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Chọn vị trí...</option>
                                    {allJobs.map((job) => (
                                        <option key={job} value={job}>{job}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">CV / Hồ sơ (PDF, DOC) *</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                <div className="flex flex-col items-center justify-center text-gray-500">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                    {formData.cvFile ? (
                                        <span className="font-medium text-secret-wax">{formData.cvFile.name}</span>
                                    ) : (
                                        <span>Kéo thả hoặc bấm để tải lên CV</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl bg-secret-wax text-white font-bold text-lg shadow-lg shadow-secret-wax/30 hover:bg-secret-wax/90 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                            GỬI THÔNG TIN ỨNG TUYỂN
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Recruitment;
