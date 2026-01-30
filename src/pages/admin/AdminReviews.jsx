import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, deleteDoc, doc, getDoc } from "firebase/firestore";
import { Search, Trash2, Star, MessageSquare } from "lucide-react";

import { db } from "../../firebase";

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [courses, setCourses] = useState({}); // Cache for course names

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "reviews"),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const reviewData = [];
            const courseIds = new Set();

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                reviewData.push({ id: doc.id, ...data });
                if (data.courseId) courseIds.add(data.courseId);
            });

            setReviews(reviewData);

            // Fetch course info if needed
            const coursesMap = { ...courses };
            for (const cId of courseIds) {
                if (!coursesMap[cId]) {
                    try {
                        const cDoc = await getDoc(doc(db, "courses", cId));
                        if (cDoc.exists()) {
                            coursesMap[cId] = cDoc.data().name;
                        }
                    } catch (e) { console.error(e) }
                }
            }
            setCourses(coursesMap);

        } catch (error) {
            console.error("Error fetching reviews:", error);
            // alert("Lỗi tải đánh giá");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (reviewId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;

        try {
            await deleteDoc(doc(db, "reviews", reviewId));
            alert("Đã xóa đánh giá!");
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (error) {
            console.error("Delete error:", error);
            alert("Lỗi xóa: " + error.message);
        }
    };

    const filteredReviews = reviews.filter(review =>
        review.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Đánh giá</h1>
                    <p className="text-slate-500">Xem và kiểm duyệt đánh giá từ học viên.</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm đánh giá..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-500">Đang tải dữ liệu...</div>
                ) : filteredReviews.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">Không tìm thấy đánh giá nào.</div>
                ) : (
                    filteredReviews.map(review => (
                        <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                                {review.userAvatar ? (
                                    <img src={review.userAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-900">{review.userName}</h4>
                                        <div className="text-xs text-slate-500">
                                            {courses[review.courseId] ? `Khóa học: ${courses[review.courseId]}` : `Mã Course: ${review.courseId}`}
                                            <span className="mx-2">•</span>
                                            {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleString('vi-VN') : '-'}
                                        </div>
                                    </div>
                                    <div className="flex text-yellow-400">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "fill-current" : "text-slate-300"}`} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {review.comment}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(review.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa đánh giá"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminReviews;
