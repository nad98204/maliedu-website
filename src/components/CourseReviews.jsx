import { useEffect, useState } from "react";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where, deleteDoc, doc } from "firebase/firestore";
import { Star, User, Trash2 } from "lucide-react";
import { auth, db } from "../firebase";

const CourseReviews = ({ courseId, currentUser }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch Reviews
    const fetchReviews = async () => {
        try {
            const q = query(
                collection(db, "reviews"),
                where("courseId", "==", courseId),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const reviewData = [];
            let totalRating = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                reviewData.push({ id: doc.id, ...data });
                totalRating += data.rating;
            });

            setReviews(reviewData);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [courseId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        if (!comment.trim()) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, "reviews"), {
                courseId,
                userId: currentUser.uid,
                userName: currentUser.displayName || "Học viên ẩn danh",
                userAvatar: currentUser.photoURL || null,
                rating,
                comment: comment.trim(),
                createdAt: serverTimestamp()
            });

            setComment("");
            setRating(5);
            fetchReviews(); // Refresh list
            alert("Cảm ơn bạn đã đánh giá!");
        } catch (error) {
            console.error("Review error:", error);
            alert("Lỗi khi gửi đánh giá: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate Average
    const averageRating = reviews.length
        ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Stats */}
            <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="text-center">
                    <div className="text-4xl font-bold text-slate-900">{averageRating}</div>
                    <div className="flex text-yellow-400 justify-center my-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-4 h-4 ${star <= Math.round(averageRating) ? "fill-current" : "text-slate-300"}`} />
                        ))}
                    </div>
                    <div className="text-sm text-slate-500">{reviews.length} đánh giá</div>
                </div>
                <div className="flex-1 border-l border-slate-200 pl-4">
                    <p className="text-slate-600 text-sm">
                        Đánh giá của học viên giúp chúng tôi cải thiện chất lượng khóa học.
                    </p>
                </div>
            </div>

            {/* List Reviews */}
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="flex gap-4 border-b border-slate-100 pb-6 last:border-0">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                            {review.userAvatar ? (
                                <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <User className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-slate-900 text-sm">{review.userName}</h4>
                                <span className="text-xs text-slate-400">
                                    {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('vi-VN') : 'Vừa xong'}
                                </span>
                            </div>
                            <div className="flex text-yellow-400 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= review.rating ? "fill-current" : "text-slate-300"}`} />
                                ))}
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Review Form */}
            {currentUser ? (
                <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">Viết đánh giá của bạn</h4>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Đánh giá chung</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`focus:outline-none transition-transform hover:scale-110 ${star <= rating ? "text-yellow-400" : "text-slate-300"}`}
                                >
                                    <Star className={`w-6 h-6 ${star <= rating ? "fill-current" : ""}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nhận xét</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secret-wax/20 focus:border-secret-wax transition-all"
                            rows="3"
                            placeholder="Chia sẻ cảm nhận của bạn về khóa học này..."
                            required
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-secret-wax text-white font-bold px-6 py-2 rounded-lg shadow-sm hover:bg-secret-ink transition-all disabled:opacity-70"
                    >
                        {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                </form>
            ) : (
                <div className="bg-slate-50 p-6 rounded-xl text-center border border-slate-200">
                    <p className="text-slate-500 mb-3">Vui lòng đăng nhập để viết đánh giá.</p>
                    <a href="/admin/login" className="text-secret-wax font-bold hover:underline">Đăng nhập ngay</a>
                </div>
            )}
        </div>
    );
};

export default CourseReviews;
