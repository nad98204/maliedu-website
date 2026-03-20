import React, { useEffect, useState } from 'react';
import {
    BookOpen,
    Download,
    FileText,
    MessageCircle,
    PenTool,
    Send,
    Trash2
} from 'lucide-react';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../firebase';

const PlayerTabs = ({ description, resources = [], lessonId, currentUser }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [note, setNote] = useState('');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!lessonId) return;

        const commentsQuery = query(
            collection(db, 'comments'),
            where('lessonId', '==', lessonId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            commentsQuery,
            (snapshot) => {
                setComments(
                    snapshot.docs.map((commentDoc) => ({
                        id: commentDoc.id,
                        ...commentDoc.data()
                    }))
                );
            },
            (error) => {
                console.error('Error fetching comments:', error);
            }
        );

        return () => unsubscribe();
    }, [lessonId]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        if (!currentUser) {
            toast.error('Vui lòng đăng nhập để bình luận');
            return;
        }

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, 'comments'), {
                text: newComment.trim(),
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email.split('@')[0],
                userAvatar:
                    currentUser.photoURL ||
                    `https://ui-avatars.com/api/?name=${currentUser.displayName || 'User'}&background=random`,
                lessonId,
                createdAt: serverTimestamp()
            });

            setNewComment('');
            toast.success('Đã gửi bình luận');
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Có lỗi xảy ra khi gửi bình luận');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;

        try {
            await deleteDoc(doc(db, 'comments', commentId));
            toast.success('Đã xóa bình luận');
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Không thể xóa bình luận');
        }
    };

    const tabs = [
        { id: 'overview', label: 'Mô tả', icon: BookOpen },
        { id: 'resources', label: 'Tài liệu', icon: FileText },
        { id: 'discussion', label: 'Thảo luận', icon: MessageCircle },
        { id: 'notes', label: 'Ghi chú', icon: PenTool }
    ];

    return (
        <div className="mx-auto mt-8 w-full max-w-5xl pb-20">
            <div className="mb-6 flex w-full flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm md:w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                            activeTab === tab.id
                                ? 'border border-red-100 bg-red-50 text-[#B91C1C] shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                    >
                        <tab.icon
                            className={`h-4 w-4 ${
                                activeTab === tab.id ? 'text-[#B91C1C]' : 'text-slate-400'
                            }`}
                        />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[300px] rounded-2xl bg-white p-6 shadow-sm">
                {activeTab === 'overview' && (
                    <div className="prose max-w-none">
                        <h3 className="mb-4 text-xl font-bold text-slate-800">
                            Giới thiệu bài học
                        </h3>
                        <div className="whitespace-pre-line leading-relaxed text-slate-600">
                            {description || 'Chưa có mô tả cho bài học này.'}
                        </div>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-slate-800">
                                Tài liệu đính kèm
                            </h3>
                            <span className="text-sm text-slate-400">
                                {resources.length} tài liệu
                            </span>
                        </div>

                        {resources.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {resources.map((file, index) => (
                                    <div
                                        key={file.id || `${file.url}-${index}`}
                                        className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="line-clamp-2 text-sm font-bold text-slate-700">
                                                    {file.name || `Tài liệu ${index + 1}`}
                                                </p>
                                                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                                    {file.sourceLabel ||
                                                        (file.lessonTitle
                                                            ? `Buoi: ${file.lessonTitle}`
                                                            : "Tai lieu chung cua khoa hoc")}
                                                </p>
                                                {file.sectionTitle && (
                                                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                                                        {file.sectionTitle}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 text-slate-400 transition-colors hover:text-secret-wax"
                                            title="Mở tài liệu"
                                        >
                                            <Download className="h-5 w-5" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
                                Chưa có tài liệu đính kèm.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'discussion' && (
                    <div>
                        <h3 className="mb-6 text-lg font-bold text-slate-800">
                            Thảo luận & Hỏi đáp
                        </h3>

                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                                    {currentUser?.photoURL ? (
                                        <img
                                            src={currentUser.photoURL}
                                            alt="User"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center font-bold text-slate-400">
                                            {currentUser?.displayName?.[0] || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        value={newComment}
                                        onChange={(event) => setNewComment(event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm transition-colors focus:border-secret-wax focus:outline-none"
                                        rows="3"
                                        placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến của bạn..."
                                        disabled={!currentUser}
                                    ></textarea>
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            onClick={handleAddComment}
                                            disabled={
                                                isSubmitting || !newComment.trim() || !currentUser
                                            }
                                            className="flex items-center gap-2 rounded-lg bg-secret-wax px-5 py-2 text-sm font-bold text-white hover:bg-secret-ink disabled:opacity-50"
                                        >
                                            <Send className="h-4 w-4" />
                                            {isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
                                        </button>
                                    </div>
                                    {!currentUser && (
                                        <p className="mt-2 text-xs text-red-400">
                                            * Vui lòng đăng nhập để bình luận
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {comments.length > 0 ? (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="group flex gap-4">
                                            <img
                                                src={
                                                    comment.userAvatar ||
                                                    'https://ui-avatars.com/api/?name=User&background=random'
                                                }
                                                alt={comment.userName}
                                                className="h-10 w-10 shrink-0 rounded-full"
                                            />
                                            <div className="flex-1">
                                                <div className="relative rounded-2xl rounded-tl-none bg-slate-50 p-4">
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-slate-800">
                                                                {comment.userName}
                                                            </span>
                                                            <span className="text-xs text-slate-400">
                                                                {comment.createdAt?.seconds
                                                                    ? new Date(
                                                                          comment.createdAt.seconds *
                                                                              1000
                                                                      ).toLocaleDateString('vi-VN')
                                                                    : 'Vừa xong'}
                                                            </span>
                                                        </div>

                                                        {(currentUser?.uid === comment.userId ||
                                                            currentUser?.role === 'admin') && (
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteComment(comment.id)
                                                                }
                                                                className="text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                                                                title="Xóa bình luận"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                                                        {comment.text}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-slate-400">
                                        Chưa có bình luận nào. Hãy là người đầu tiên!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="flex h-full flex-col">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">
                                Ghi chú của bạn
                            </h3>
                            <span className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-600">
                                Đã lưu tự động
                            </span>
                        </div>
                        <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            className="min-h-[300px] w-full flex-1 rounded-xl border border-yellow-200 bg-yellow-50/50 p-4 font-medium leading-relaxed text-slate-700 focus:outline-none"
                            placeholder="Ghi lại những ý chính của bài học tại đây..."
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerTabs;
