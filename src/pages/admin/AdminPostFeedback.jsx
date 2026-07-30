import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, MessageCircle, RotateCcw, Search, Trash2 } from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatArticleDate } from '../../utils/articleContent';

const AdminPostFeedback = () => {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [notice, setNotice] = useState(null);

    const showNotice = useCallback((message, type = 'success') => {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 3000);
    }, []);

    const fetchFeedback = useCallback(async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(query(collection(db, 'post_feedback'), orderBy('createdAt', 'desc')));
            setFeedback(snapshot.docs.map((feedbackDoc) => ({ id: feedbackDoc.id, ...feedbackDoc.data() })));
        } catch (error) {
            console.error('Error fetching post feedback:', error);
            showNotice('Không thể tải phản hồi độc giả', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotice]);

    useEffect(() => {
        fetchFeedback();
    }, [fetchFeedback]);

    const filteredFeedback = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        return feedback.filter((item) => {
            const approved = Boolean(item.isApproved);
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'approved' ? approved : !approved);
            const matchesKeyword = !keyword || [item.name, item.message, item.postTitle, item.postSlug]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(keyword));
            return matchesStatus && matchesKeyword;
        });
    }, [feedback, searchTerm, statusFilter]);

    const stats = useMemo(() => ({
        total: feedback.length,
        approved: feedback.filter((item) => item.isApproved).length,
        pending: feedback.filter((item) => !item.isApproved).length,
    }), [feedback]);

    const setApproval = async (item, isApproved) => {
        setProcessingId(item.id);
        try {
            await updateDoc(doc(db, 'post_feedback', item.id), {
                isApproved,
                status: isApproved ? 'approved' : 'pending',
                reviewedAt: serverTimestamp(),
            });
            setFeedback((current) => current.map((entry) => entry.id === item.id ? { ...entry, isApproved, status: isApproved ? 'approved' : 'pending' } : entry));
            showNotice(isApproved ? 'Đã duyệt phản hồi' : 'Đã chuyển phản hồi về chờ duyệt');
        } catch (error) {
            console.error('Error updating feedback:', error);
            showNotice('Không thể cập nhật phản hồi', 'error');
        } finally {
            setProcessingId('');
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Xóa phản hồi của ${item.name || 'Ẩn danh'}?`)) return;
        setProcessingId(item.id);
        try {
            await deleteDoc(doc(db, 'post_feedback', item.id));
            setFeedback((current) => current.filter((entry) => entry.id !== item.id));
            showNotice('Đã xóa phản hồi');
        } catch (error) {
            console.error('Error deleting feedback:', error);
            showNotice('Không thể xóa phản hồi', 'error');
        } finally {
            setProcessingId('');
        }
    };

    return (
        <div className="space-y-6 px-4 pb-8 pt-5 sm:px-6 lg:px-8">
            {notice && <div className={`fixed right-4 top-4 z-50 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg ${notice.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>{notice.message}</div>}

            <div>
                <h1 className="text-2xl font-bold text-slate-900">Phản hồi bài viết</h1>
                <p className="mt-1 text-sm text-slate-500">Duyệt chia sẻ của độc giả trước khi hiển thị công khai.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Tổng phản hồi" value={stats.total} color="text-slate-900" />
                <StatCard label="Chờ duyệt" value={stats.pending} color="text-amber-700" />
                <StatCard label="Đã duyệt" value={stats.approved} color="text-green-700" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                        <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm người gửi, nội dung hoặc bài viết…" className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" />
                    </div>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-secret-wax">
                        <option value="pending">Chờ duyệt</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="all">Tất cả</option>
                    </select>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-sm text-slate-500">Đang tải phản hồi…</div>
                ) : filteredFeedback.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-slate-400"><MessageCircle className="h-10 w-10" /><p className="text-sm">Không có phản hồi phù hợp.</p></div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredFeedback.map((item) => (
                            <article key={item.id} className="p-5 transition hover:bg-slate-50/70">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-semibold text-slate-900">{item.name || 'Ẩn danh'}</h2>
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}</span>
                                            <time className="text-xs text-slate-400">{formatArticleDate(item.createdAt)}</time>
                                        </div>
                                        <p className="mt-2 text-xs font-medium text-secret-wax">{item.postTitle || item.postSlug || 'Bài viết không xác định'}</p>
                                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">{item.message}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {item.isApproved ? (
                                            <ActionButton label="Bỏ duyệt" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setApproval(item, false)} disabled={processingId === item.id} className="text-amber-700 hover:bg-amber-50" />
                                        ) : (
                                            <ActionButton label="Duyệt" icon={<Check className="h-4 w-4" />} onClick={() => setApproval(item, true)} disabled={processingId === item.id} className="text-green-700 hover:bg-green-50" />
                                        )}
                                        <ActionButton label="Xóa" icon={<Trash2 className="h-4 w-4" />} onClick={() => handleDelete(item)} disabled={processingId === item.id} className="text-red-600 hover:bg-red-50" />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const StatCard = ({ label, value, color }) => <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p></div>;

const ActionButton = ({ label, icon, className, ...props }) => <button type="button" className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 ${className}`} {...props}>{icon}{label}</button>;

export default AdminPostFeedback;
