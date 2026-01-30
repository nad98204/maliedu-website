import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, MessageCircle, PenTool, Download, Send, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const PlayerTabs = ({ description, resources = [], comments: initialComments = [], lessonId, currentUser }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [note, setNote] = useState('');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch comments for current lesson
    useEffect(() => {
        if (!lessonId) return;

        const q = query(
            collection(db, 'comments'),
            where('lessonId', '==', lessonId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(commentsData);
        }, (error) => {
            console.error("Error fetching comments:", error);
        });

        return () => unsubscribe();
    }, [lessonId]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        if (!currentUser) {
            toast.error("Vui lòng đăng nhập để bình luận");
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'comments'), {
                text: newComment.trim(),
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email.split('@')[0],
                userAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'User'}&background=random`,
                lessonId: lessonId,
                createdAt: serverTimestamp()
            });
            setNewComment('');
            toast.success("Đã gửi bình luận");
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error("Có lỗi xảy ra khi gửi bình luận");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;
        try {
            await deleteDoc(doc(db, 'comments', commentId));
            toast.success("Đã xóa bình luận");
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error("Không thể xóa bình luận");
        }
    };

    const tabs = [
        { id: 'overview', label: 'Mô tả', icon: BookOpen },
        { id: 'resources', label: 'Tài liệu', icon: FileText },
        { id: 'discussion', label: 'Thảo luận', icon: MessageCircle },
        { id: 'notes', label: 'Ghi chú', icon: PenTool },
    ];

    return (
        <div className="w-full max-w-5xl mx-auto mt-8 pb-20">
            {/* Tabs Header */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl mb-6 w-full md:w-fit border border-slate-200 shadow-sm">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-red-50 text-[#B91C1C] border border-red-100 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#B91C1C]' : 'text-slate-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl p-6 min-h-[300px] shadow-sm">

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="prose max-w-none">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Giới thiệu bài học</h3>
                        <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                            {description || "Chưa có mô tả cho bài học này."}
                        </div>
                    </div>
                )}

                {/* RESOURCES */}
                {activeTab === 'resources' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Tài liệu đính kèm</h3>
                        {resources.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resources.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">{file.name || `Tài liệu bài học ${idx + 1}`}</p>
                                                <p className="text-xs text-slate-400">Nhấp để mở</p>
                                            </div>
                                        </div>
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-slate-400 hover:text-secret-wax p-2"
                                        >
                                            <Download className="w-5 h-5" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Chưa có tài liệu đính kèm.
                            </div>
                        )}
                    </div>
                )}

                {/* DISCUSSION */}
                {activeTab === 'discussion' && (
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Thảo luận & Hỏi đáp</h3>

                        <div className="space-y-8">
                            {/* Input */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden">
                                    {currentUser?.photoURL ? (
                                        <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                            {currentUser?.displayName?.[0] || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-secret-wax transition-colors text-sm"
                                        rows="3"
                                        placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến của bạn..."
                                        disabled={!currentUser}
                                    ></textarea>
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={handleAddComment}
                                            disabled={isSubmitting || !newComment.trim() || !currentUser}
                                            className="px-5 py-2 bg-secret-wax text-white text-sm font-bold rounded-lg hover:bg-secret-ink disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            {isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
                                        </button>
                                    </div>
                                    {!currentUser && (
                                        <p className="text-xs text-red-400 mt-2">* Vui lòng đăng nhập để bình luận</p>
                                    )}
                                </div>
                            </div>

                            {/* Comments List */}
                            <div className="space-y-6">
                                {comments.length > 0 ? comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-4 group">
                                        <img src={comment.userAvatar || "https://ui-avatars.com/api/?name=User&background=random"} alt={comment.userName} className="w-10 h-10 rounded-full shrink-0" />
                                        <div className="flex-1">
                                            <div className="bg-slate-50 rounded-2xl rounded-tl-none p-4 relative">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-sm">{comment.userName}</span>
                                                        <span className="text-xs text-slate-400">{comment.createdAt?.seconds ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                                                    </div>

                                                    {(currentUser?.uid === comment.userId || currentUser?.role === 'admin') && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Xóa bình luận"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.text}</p>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-slate-400 py-8">
                                        Chưa có bình luận nào. Hãy là người đầu tiên!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* NOTES */}
                {activeTab === 'notes' && (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Ghi chú của bạn</h3>
                            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">Đã lưu tự động</span>
                        </div>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="flex-1 min-h-[300px] w-full p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl focus:outline-none text-slate-700 leading-relaxed font-medium"
                            placeholder="Ghi lại những ý chính của bài học tại đây..."
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerTabs;
