import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { Edit, Trash2, Plus, X, Image as ImageIcon, Upload, Eye, Search, Filter, ChevronDown, Globe, FileText, Video, Star } from 'lucide-react';
import { db } from '../../firebase';
import RichTextEditor from '../../components/RichTextEditor';
import { uploadFileToS3 } from '../../utils/s3UploadService';

const defaultFormData = {
    title: '',
    slug: '',
    type: 'article',
    category: 'Tin tức chung',
    author: 'Mong Coaching',
    thumbnailUrl: '',
    thumbnailAlt: '',
    videoUrl: '',
    excerpt: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    isPublished: true,
};

const CATEGORY_OPTIONS = [
    'Tin tức chung',
    'Sự kiện & Hoạt động',
    'Thông báo Lịch học',
    'Góc Báo chí',
];

const AdminPosts = () => {
    const [posts, setPosts] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [formData, setFormData] = useState(defaultFormData);
    const [seoKeywordDraft, setSeoKeywordDraft] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [initialFormSnapshot, setInitialFormSnapshot] = useState(JSON.stringify(defaultFormData));
    const fieldRefs = useRef({});

    const headingId = editingPost ? 'edit-post-heading' : 'add-post-heading';

    const fetchPosts = async () => {
        try {
            const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(postsQuery);
            const postsData = snapshot.docs
                .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
                .filter((post) => {
                    const knowledgeCategories = [
                        'Luật Nhân Quả & Luật Hấp Dẫn',
                        'Tiềm Thức & Tái Lập Trình Niềm Tin',
                        'Chữa Lành Nội Tâm & Đứa Trẻ Bên Trong',
                        'Thiền Dẫn & Thực Hành Năng Lượng',
                        'Năng Lượng Tiền & Thịnh Vượng',
                        'Mục Tiêu – Kỷ Luật – Hiệu Suất',
                        'Kinh Doanh Bằng Bản Thể & Giá Trị',
                        'Video Podcast Đồng Hành',
                    ];
                    return (!post.category || !knowledgeCategories.includes(post.category)) && (!post.category || !post.category.includes('Cảm nhận'));
                });
            setPosts(postsData);
        } catch (error) {
            console.error('Error fetching posts:', error);
            showToast('Không thể tải bài viết', 'error');
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const generateSlug = (title) =>
        title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const stripHtmlContent = (html = '') =>
        html
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

    const isFormDirty = useMemo(() => JSON.stringify(formData) !== initialFormSnapshot, [formData, initialFormSnapshot]);
    const seoKeywordList = useMemo(
        () =>
            (formData.seoKeywords || '')
                .split(',')
                .map((keyword) => keyword.trim())
                .filter(Boolean),
        [formData.seoKeywords]
    );

    useEffect(() => {
        if (!isFormOpen || !isFormDirty) return undefined;
        const beforeUnloadHandler = (event) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        return () => window.removeEventListener('beforeunload', beforeUnloadHandler);
    }, [isFormOpen, isFormDirty]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'title' && { slug: generateSlug(value) }),
            ...(name === 'title' && !prev.seoTitle.trim() && { seoTitle: value }),
            ...(name === 'excerpt' && !prev.seoDescription.trim() && { seoDescription: value }),
            ...(name === 'title' && !prev.thumbnailAlt.trim() && { thumbnailAlt: value }),
        }));
        setFormErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleContentChange = (value) => {
        setFormData((prev) => ({ ...prev, content: value }));
    };

    const handleImageUpload = async (event) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;
        if (!selectedFile.type.startsWith('image/')) {
            showToast('Vui lòng chọn file ảnh hợp lệ', 'error');
            return;
        }

        setIsUploadingImage(true);
        try {
            const uploadedUrl = await uploadFileToS3(selectedFile, null, { folder: 'posts' });
            setFormData((prev) => ({ ...prev, thumbnailUrl: uploadedUrl }));
            showToast('Tải ảnh bìa thành công!');
        } catch (error) {
            console.error('Lỗi upload:', error);
            showToast('Lỗi khi tải ảnh lên', 'error');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleRemoveImage = () => {
        setFormData((prev) => ({ ...prev, thumbnailUrl: '' }));
    };

    const handleAddNew = () => {
        setEditingPost(null);
        const freshForm = { ...defaultFormData };
        setFormData(freshForm);
        setSeoKeywordDraft('');
        setFormErrors({});
        setInitialFormSnapshot(JSON.stringify(freshForm));
        setIsUploadingImage(false);
        setIsFormOpen(true);
    };

    const handleEdit = (post) => {
        setEditingPost(post);
        const preparedForm = {
            title: post.title || '',
            slug: post.slug || '',
            type: post.type || 'article',
            category: post.category || 'Tin tức chung',
            author: post.author || 'Mong Coaching',
            thumbnailUrl: post.thumbnailUrl || '',
            thumbnailAlt: post.thumbnailAlt || '',
            videoUrl: post.videoUrl || '',
            excerpt: post.excerpt || '',
            content: post.content || '',
            seoTitle: post.seoTitle || '',
            seoDescription: post.seoDescription || '',
            seoKeywords: post.seoKeywords || '',
            isPublished: post.isPublished !== undefined ? post.isPublished : true,
        };
        setFormData(preparedForm);
        setSeoKeywordDraft('');
        setFormErrors({});
        setInitialFormSnapshot(JSON.stringify(preparedForm));
        setIsUploadingImage(false);
        setIsFormOpen(true);
    };

    const addSeoKeywordsFromInput = (rawValue) => {
        const candidates = (rawValue || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        if (candidates.length === 0) return;

        const normalizedCurrent = seoKeywordList.map((item) => item.toLowerCase());
        const merged = [...seoKeywordList];
        candidates.forEach((candidate) => {
            if (!normalizedCurrent.includes(candidate.toLowerCase())) {
                merged.push(candidate);
                normalizedCurrent.push(candidate.toLowerCase());
            }
        });

        setFormData((prev) => ({ ...prev, seoKeywords: merged.join(', ') }));
        setSeoKeywordDraft('');
    };

    const removeSeoKeyword = (keywordToRemove) => {
        const nextKeywords = seoKeywordList.filter((keyword) => keyword !== keywordToRemove);
        setFormData((prev) => ({ ...prev, seoKeywords: nextKeywords.join(', ') }));
    };

    const handleCloseForm = () => {
        if (isFormDirty && !window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng biểu mẫu?')) return;
        setIsFormOpen(false);
    };

    const validateAndPrepareContent = async () => {
        if (!stripHtmlContent(formData.content)) return { error: 'Vui lòng nhập nội dung chi tiết trước khi lưu.', field: 'content' };
        return { content: formData.content };
    };

    const focusFirstErrorField = (errors) => {
        const orderedKeys = ['title', 'slug', 'excerpt', 'content', 'thumbnailUrl', 'videoUrl', 'category'];
        const firstKey = orderedKeys.find((key) => errors[key]) || Object.keys(errors)[0];
        const targetField = fieldRefs.current[firstKey];
        if (targetField?.focus) {
            targetField.focus();
            if (firstKey !== 'content' && targetField.scrollIntoView) {
                targetField.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }
    };

    const checkSlugExists = async (slug) => {
        const normalizedSlug = (slug || '').trim();
        const slugQuery = query(collection(db, 'posts'), where('slug', '==', normalizedSlug), limit(5));
        const slugSnapshot = await getDocs(slugQuery);
        return slugSnapshot.docs.some((slugDoc) => slugDoc.id !== editingPost?.id);
    };

    const handlePreview = async () => {
        const prepared = await validateAndPrepareContent();
        if (prepared.error) {
            showToast(prepared.error, 'error');
            return;
        }
        if (prepared.content !== formData.content) {
            setFormData((prev) => ({ ...prev, content: prepared.content }));
        }
        setIsPreviewOpen(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const nextErrors = {};
            if (!formData.title.trim()) nextErrors.title = 'Vui lòng nhập tiêu đề.';
            if (!(formData.slug || generateSlug(formData.title)).trim()) nextErrors.slug = 'Vui lòng nhập slug hợp lệ.';
            if (!formData.excerpt.trim()) nextErrors.excerpt = 'Vui lòng nhập mô tả ngắn.';
            if (!formData.thumbnailUrl.trim()) nextErrors.thumbnailUrl = 'Vui lòng thêm ảnh bìa.';
            if (!formData.category.trim()) nextErrors.category = 'Vui lòng chọn danh mục.';
            if (formData.type === 'video' && !formData.videoUrl.trim()) nextErrors.videoUrl = 'Vui lòng nhập URL video.';

            if (Object.keys(nextErrors).length > 0) {
                setFormErrors(nextErrors);
                focusFirstErrorField(nextErrors);
                showToast('Vui lòng kiểm tra các trường bắt buộc.', 'error');
                return;
            }

            const generatedSlug = (formData.slug || generateSlug(formData.title)).trim();
            if (!generatedSlug) {
                const slugError = { slug: 'Vui lòng nhập tiêu đề hoặc slug hợp lệ.' };
                setFormErrors((prev) => ({ ...prev, ...slugError }));
                focusFirstErrorField(slugError);
                showToast('Vui lòng nhập tiêu đề hoặc slug hợp lệ.', 'error');
                return;
            }

            const prepared = await validateAndPrepareContent();
            if (prepared.error) {
                if (prepared.field) {
                    const contentError = { [prepared.field]: prepared.error };
                    setFormErrors((prev) => ({ ...prev, ...contentError }));
                    focusFirstErrorField(contentError);
                }
                showToast(prepared.error, 'error');
                return;
            }

            const slugTaken = await checkSlugExists(generatedSlug);
            if (slugTaken) {
                const slugTakenError = { slug: 'Slug đã tồn tại. Vui lòng chọn slug khác.' };
                setFormErrors((prev) => ({ ...prev, ...slugTakenError }));
                focusFirstErrorField(slugTakenError);
                showToast('Slug đã tồn tại. Vui lòng chọn slug khác.', 'error');
                return;
            }
            setIsSubmitting(true);
            const finalContent = prepared.content;
            if (finalContent !== formData.content) {
                setFormData((prev) => ({ ...prev, content: finalContent }));
            }

            const postData = {
                ...formData,
                slug: generatedSlug,
                content: finalContent,
                updatedAt: Date.now(),
            };

            if (editingPost) {
                await updateDoc(doc(db, 'posts', editingPost.id), postData);
                showToast('Cập nhật bài viết thành công!');
            } else {
                await addDoc(collection(db, 'posts'), { ...postData, createdAt: Date.now() });
                showToast('Đăng bài viết thành công!');
            }

            setFormErrors({});
            setIsFormOpen(false);
            setInitialFormSnapshot(JSON.stringify({ ...postData }));
            fetchPosts();
        } catch (error) {
            console.error('Error saving post:', error);
            showToast('Lỗi khi lưu bài viết', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
        try {
            await deleteDoc(doc(db, 'posts', postId));
            setPosts((prev) => prev.filter((post) => post.id !== postId));
            showToast('Xóa bài viết thành công!');
        } catch (error) {
            console.error('Error deleting post:', error);
            showToast('Lỗi khi xóa bài viết', 'error');
        }
    };

    const getTypeBadge = (type) => {
        const badges = {
            video: { bg: 'bg-red-100', text: 'text-red-700', label: 'Video' },
            'case-study': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Success Story' },
            article: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Bài viết' },
        };
        return badges[type] || badges.article;
    };

    const getStatusBadge = (isPublished) =>
        isPublished
            ? { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã xuất bản' }
            : { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Bản nháp' };

    const filteredPosts = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        return posts.filter((post) => {
            const matchKeyword =
                !keyword ||
                post.title?.toLowerCase().includes(keyword) ||
                post.slug?.toLowerCase().includes(keyword) ||
                post.category?.toLowerCase().includes(keyword);
            const matchStatus =
                statusFilter === 'all' ||
                (statusFilter === 'published' && post.isPublished) ||
                (statusFilter === 'draft' && !post.isPublished);
            return matchKeyword && matchStatus;
        });
    }, [posts, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const total = posts.length;
        const published = posts.filter((post) => post.isPublished).length;
        return { total, published, drafts: total - published };
    }, [posts]);

    const seoMetrics = useMemo(() => {
        const titleLength = (formData.seoTitle || '').trim().length;
        const descriptionLength = (formData.seoDescription || '').trim().length;

        const titleStatus = titleLength === 0 ? 'neutral' : titleLength < 50 || titleLength > 60 ? 'warning' : 'good';
        const descriptionStatus =
            descriptionLength === 0 ? 'neutral' : descriptionLength < 140 || descriptionLength > 160 ? 'warning' : 'good';

        return { titleLength, descriptionLength, titleStatus, descriptionStatus };
    }, [formData.seoTitle, formData.seoDescription]);

    return (
        <div className="space-y-6 px-4 pb-6 pt-5 sm:px-6 sm:pt-6 lg:px-8">
            {toast && (
                <div
                    className={`fixed right-4 top-4 z-50 rounded-lg px-6 py-3 text-white shadow-lg ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
                    aria-live="polite"
                >
                    {toast.message}
                </div>
            )}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Tin Tức & Sự Kiện</h1>
                    <p className="mt-1 text-sm text-slate-500">Tạo, chỉnh sửa và quản lý nội dung blog</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-2 self-start rounded-lg bg-secret-wax px-4 py-2 text-sm font-semibold text-white transition hover:bg-secret-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secret-wax/60"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Thêm bài viết mới
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tổng bài viết</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đã xuất bản</p>
                    <p className="mt-2 text-2xl font-bold text-green-700">{stats.published}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bản nháp</p>
                    <p className="mt-2 text-2xl font-bold text-slate-700">{stats.drafts}</p>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-md">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                        <input
                            type="text"
                            name="post-search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Tìm theo tiêu đề, slug hoặc danh mục…"
                            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                            aria-label="Tìm kiếm bài viết"
                            autoComplete="off"
                        />
                    </div>
                    <div className="inline-flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        <label htmlFor="post-status-filter" className="text-sm font-medium text-slate-600">
                            Trạng thái
                        </label>
                        <select
                            id="post-status-filter"
                            name="statusFilter"
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                        >
                            <option value="all">Tất cả</option>
                            <option value="published">Đã xuất bản</option>
                            <option value="draft">Bản nháp</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-200">
                            <tr>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Ảnh</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tiêu đề</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Phân loại</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Trạng thái</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Danh mục</th>
                                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPosts.map((post) => {
                                const typeBadge = getTypeBadge(post.type);
                                const statusBadge = getStatusBadge(post.isPublished);
                                return (
                                    <tr key={post.id} className="hover:bg-slate-50">
                                        <td className="py-4">
                                            <img
                                                src={post.thumbnailUrl || 'https://placehold.co/600x400?text=Mali+Edu'}
                                                alt={post.thumbnailAlt || post.title}
                                                className="h-12 w-16 rounded-lg object-cover"
                                                loading="lazy"
                                                onError={(event) => {
                                                    event.target.onerror = null;
                                                    event.target.src = 'https://placehold.co/600x400?text=Mali+Edu';
                                                }}
                                            />
                                        </td>
                                        <td className="py-4">
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="max-w-[280px] truncate text-left text-sm font-medium text-slate-900 hover:text-secret-wax"
                                                title={post.title}
                                            >
                                                {post.title}
                                            </button>
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
                                                {typeBadge.label}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                                {statusBadge.label}
                                            </span>
                                        </td>
                                        <td className="py-4 text-sm text-slate-600">{post.category}</td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(post)}
                                                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                                    title="Sửa"
                                                    aria-label={`Sửa bài viết ${post.title}`}
                                                >
                                                    <Edit className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                    title="Xóa"
                                                    aria-label={`Xóa bài viết ${post.title}`}
                                                >
                                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-sm text-slate-500">
                                        {posts.length === 0
                                            ? 'Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!'
                                            : 'Không tìm thấy bài viết phù hợp với bộ lọc hiện tại.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormOpen && createPortal(
                <div
                    className="fixed inset-0 z-[9998] flex flex-col bg-slate-100"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={headingId}
                >
                    {/* ── Header bar ─────────────────────────────────── */}
                    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleCloseForm}
                                aria-label="Đóng và quay lại"
                                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
                            <h2 id={headingId} className="text-sm font-semibold text-slate-800">
                                {editingPost ? 'Chỉnh sửa bài viết' : 'Bài viết mới'}
                            </h2>
                            {isFormDirty && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    Chưa lưu
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePreview}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                            >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                                Xem trước
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, isPublished: !prev.isPublished }))}
                                aria-label={formData.isPublished ? 'Đang xuất bản – nhấn để chuyển nháp' : 'Đang là nháp – nhấn để xuất bản'}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 ${
                                    formData.isPublished
                                        ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 focus-visible:ring-green-400/50'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-slate-400/50'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${formData.isPublished ? 'bg-green-500' : 'bg-slate-400'}`} aria-hidden="true" />
                                {formData.isPublished ? 'Xuất bản' : 'Bản nháp'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="rounded-lg bg-secret-wax px-5 py-2 text-sm font-semibold text-white transition hover:bg-secret-ink disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secret-wax/60"
                            >
                                {isSubmitting ? 'Đang lưu…' : editingPost ? 'Cập nhật' : 'Đăng bài'}
                            </button>
                        </div>
                    </header>

                    {/* ── Body ───────────────────────────────────────── */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex min-h-0 flex-1 overflow-hidden"
                    >
                        {/* ── LEFT: Content area ─────────────────────── */}
                        <main className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 lg:px-12">
                            <div className="mx-auto max-w-3xl space-y-7">

                                {/* Title */}
                                <div>
                                    <input
                                        id="post-title"
                                        type="text"
                                        name="title"
                                        ref={(el) => { fieldRefs.current.title = el; }}
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        aria-invalid={Boolean(formErrors.title)}
                                        placeholder="Nhập tiêu đề bài viết…"
                                        className={`w-full border-0 bg-transparent text-3xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none ${formErrors.title ? 'ring-2 ring-red-400 ring-offset-2 rounded-lg px-2' : ''}`}
                                    />
                                    {formErrors.title && <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>}
                                </div>

                                {/* Slug */}
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                    <Globe className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                                    <span className="shrink-0 text-xs text-slate-400">/tin-tuc/</span>
                                    <input
                                        id="post-slug"
                                        type="text"
                                        name="slug"
                                        ref={(el) => { fieldRefs.current.slug = el; }}
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        aria-invalid={Boolean(formErrors.slug)}
                                        placeholder="slug-bai-viet"
                                        className="min-w-0 flex-1 bg-transparent font-mono text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                                        spellCheck={false}
                                    />
                                    {formErrors.slug && <p className="text-xs text-red-500">{formErrors.slug}</p>}
                                </div>

                                {/* Excerpt */}
                                <div className="space-y-1.5">
                                    <label htmlFor="post-excerpt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Mô tả ngắn <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="post-excerpt"
                                        name="excerpt"
                                        ref={(el) => { fieldRefs.current.excerpt = el; }}
                                        value={formData.excerpt}
                                        onChange={handleInputChange}
                                        rows={3}
                                        aria-invalid={Boolean(formErrors.excerpt)}
                                        placeholder="Tóm tắt hấp dẫn (hiển thị ngoài trang danh sách và SEO description)…"
                                        className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${formErrors.excerpt ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-secret-wax focus:ring-secret-wax/20'}`}
                                    />
                                    {formErrors.excerpt && <p className="text-xs text-red-600">{formErrors.excerpt}</p>}
                                </div>

                                {/* Content editor */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Nội dung bài viết <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        ref={(el) => { fieldRefs.current.content = el; }}
                                        tabIndex={-1}
                                        className={formErrors.content ? 'rounded-xl ring-2 ring-red-400 ring-offset-2' : ''}
                                    >
                                        <RichTextEditor
                                            value={formData.content}
                                            onChange={handleContentChange}
                                            placeholder="Bắt đầu viết bài tại đây…"
                                        />
                                    </div>
                                    {formErrors.content && <p className="text-xs text-red-600">{formErrors.content}</p>}
                                </div>

                                {/* SEO section */}
                                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-green-600" aria-hidden="true" />
                                        <h3 className="text-sm font-semibold text-slate-800">Tối Ưu Hóa SEO</h3>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="post-seo-title" className="text-xs font-medium text-slate-600">
                                            SEO Title
                                        </label>
                                        <input
                                            id="post-seo-title"
                                            type="text"
                                            name="seoTitle"
                                            value={formData.seoTitle}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            placeholder="Tiêu đề hiển thị trên Google…"
                                        />
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1 flex-1 rounded-full ${seoMetrics.titleStatus === 'good' ? 'bg-green-500' : seoMetrics.titleStatus === 'warning' ? 'bg-amber-400' : 'bg-slate-200'}`} />
                                            <span className={`text-[11px] ${seoMetrics.titleStatus === 'good' ? 'text-green-600' : seoMetrics.titleStatus === 'warning' ? 'text-amber-600' : 'text-slate-400'}`}>
                                                {seoMetrics.titleLength}/60 {seoMetrics.titleStatus === 'good' ? '✓' : seoMetrics.titleStatus === 'warning' ? '(khuyến nghị 50-60)' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="post-seo-description" className="text-xs font-medium text-slate-600">
                                            SEO Description
                                        </label>
                                        <textarea
                                            id="post-seo-description"
                                            name="seoDescription"
                                            value={formData.seoDescription}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            placeholder="Mô tả hiển thị dưới tiêu đề trên Google (khoảng 150 ký tự)…"
                                        />
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1 flex-1 rounded-full ${seoMetrics.descriptionStatus === 'good' ? 'bg-green-500' : seoMetrics.descriptionStatus === 'warning' ? 'bg-amber-400' : 'bg-slate-200'}`} />
                                            <span className={`text-[11px] ${seoMetrics.descriptionStatus === 'good' ? 'text-green-600' : seoMetrics.descriptionStatus === 'warning' ? 'text-amber-600' : 'text-slate-400'}`}>
                                                {seoMetrics.descriptionLength}/160 {seoMetrics.descriptionStatus === 'good' ? '✓' : seoMetrics.descriptionStatus === 'warning' ? '(khuyến nghị 140-160)' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="post-seo-keywords" className="text-xs font-medium text-slate-600">
                                            SEO Keywords
                                        </label>
                                        <div className="min-h-[42px] rounded-lg border border-slate-200 px-2 py-1.5 focus-within:border-secret-wax focus-within:ring-2 focus-within:ring-secret-wax/20">
                                            <div className="flex flex-wrap gap-1.5">
                                                {seoKeywordList.map((kw) => (
                                                    <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                        {kw}
                                                        <button type="button" onClick={() => removeSeoKeyword(kw)} aria-label={`Xóa "${kw}"`} className="text-slate-400 hover:text-red-600 focus-visible:outline-none">
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <input
                                                    id="post-seo-keywords"
                                                    type="text"
                                                    value={seoKeywordDraft}
                                                    onChange={(event) => setSeoKeywordDraft(event.target.value)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ',') {
                                                            event.preventDefault();
                                                            addSeoKeywordsFromInput(seoKeywordDraft);
                                                        }
                                                    }}
                                                    onBlur={() => addSeoKeywordsFromInput(seoKeywordDraft)}
                                                    placeholder={seoKeywordList.length === 0 ? 'Nhập keyword, Enter để thêm…' : ''}
                                                    className="min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-400">{seoKeywordList.length} keyword · Enter hoặc dấu phẩy để thêm</p>
                                    </div>
                                </div>
                            </div>
                        </main>

                        {/* ── RIGHT: Settings sidebar ─────────────────── */}
                        <aside className="hidden w-72 shrink-0 overflow-y-auto overscroll-contain border-l border-slate-200 bg-white px-4 py-6 lg:flex lg:flex-col lg:gap-5 xl:w-80">

                            {/* Type */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loại bài viết</p>
                                <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 p-1">
                                    {[
                                        { value: 'article', label: 'Bài viết', icon: <FileText className="h-3.5 w-3.5" /> },
                                        { value: 'video', label: 'Video', icon: <Video className="h-3.5 w-3.5" /> },
                                        { value: 'case-study', label: 'Case', icon: <Star className="h-3.5 w-3.5" /> },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, type: opt.value }))}
                                            className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold transition ${
                                                formData.type === opt.value
                                                    ? 'bg-secret-wax text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category */}
                            <div className="space-y-1.5">
                                <label htmlFor="post-category" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Danh mục <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="post-category"
                                        name="category"
                                        ref={(el) => { fieldRefs.current.category = el; }}
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        aria-invalid={Boolean(formErrors.category)}
                                        className={`w-full appearance-none rounded-lg border py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 ${formErrors.category ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-secret-wax focus:ring-secret-wax/20'}`}
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {CATEGORY_OPTIONS.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                                </div>
                                {formErrors.category && <p className="text-xs text-red-600">{formErrors.category}</p>}
                            </div>

                            {/* Author */}
                            <div className="space-y-1.5">
                                <label htmlFor="post-author" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Tác giả
                                </label>
                                <input
                                    id="post-author"
                                    type="text"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                    placeholder="Mong Coaching"
                                />
                            </div>

                            <div className="border-t border-slate-100" />

                            {/* Thumbnail */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Ảnh bìa <span className="text-red-500">*</span>
                                </p>

                                {formData.thumbnailUrl ? (
                                    <div className="group relative overflow-hidden rounded-xl border border-slate-200">
                                        <img
                                            src={formData.thumbnailUrl}
                                            alt={formData.thumbnailAlt || 'Preview'}
                                            className="h-36 w-full object-cover"
                                            onError={(ev) => { ev.target.onerror = null; ev.target.src = 'https://via.placeholder.com/400x300?text=Error'; }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                                            >
                                                <Trash2 className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />
                                                Xóa ảnh
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="post-image-upload"
                                        className={`flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition ${isUploadingImage ? 'border-secret-wax bg-secret-wax/5' : 'border-slate-300 bg-slate-50 hover:border-secret-wax hover:bg-secret-wax/5'}`}
                                    >
                                        {isUploadingImage ? (
                                            <>
                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-secret-wax border-t-transparent" />
                                                <span className="text-xs text-slate-500">Đang tải lên…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                                <span className="text-xs font-medium text-slate-500">Nhấn để chọn ảnh</span>
                                                <span className="text-[10px] text-slate-400">PNG, JPG tới 10MB</span>
                                            </>
                                        )}
                                        <input
                                            id="post-image-upload"
                                            name="file-upload"
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                )}

                                <div className="relative">
                                    <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                                    <input
                                        id="post-thumbnail-url"
                                        type="url"
                                        name="thumbnailUrl"
                                        ref={(el) => { fieldRefs.current.thumbnailUrl = el; }}
                                        value={formData.thumbnailUrl}
                                        onChange={handleInputChange}
                                        aria-invalid={Boolean(formErrors.thumbnailUrl)}
                                        className={`w-full rounded-lg border py-2 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 ${formErrors.thumbnailUrl ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-secret-wax focus:ring-secret-wax/20'}`}
                                        placeholder="Hoặc dán URL ảnh…"
                                    />
                                </div>
                                {formErrors.thumbnailUrl && <p className="text-xs text-red-600">{formErrors.thumbnailUrl}</p>}

                                <input
                                    id="post-thumbnail-alt"
                                    type="text"
                                    name="thumbnailAlt"
                                    value={formData.thumbnailAlt}
                                    onChange={handleInputChange}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-400 focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                    placeholder="Alt ảnh (SEO ảnh)…"
                                />
                            </div>

                            {/* Video URL when type = video */}
                            {formData.type === 'video' && (
                                <div className="space-y-1.5">
                                    <label htmlFor="post-video-url" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        URL Video <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="post-video-url"
                                        type="url"
                                        name="videoUrl"
                                        ref={(el) => { fieldRefs.current.videoUrl = el; }}
                                        value={formData.videoUrl}
                                        onChange={handleInputChange}
                                        aria-invalid={Boolean(formErrors.videoUrl)}
                                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${formErrors.videoUrl ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-secret-wax focus:ring-secret-wax/20'}`}
                                        placeholder="https://www.youtube.com/embed/..."
                                    />
                                    {formErrors.videoUrl && <p className="text-xs text-red-600">{formErrors.videoUrl}</p>}
                                </div>
                            )}
                        </aside>
                    </form>
                </div>,
                document.body
            )}

            {isPreviewOpen && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4">
                    <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                            <h3 className="flex items-center gap-2 text-base font-bold text-gray-800">
                                <Eye className="h-4 w-4 text-secret-wax" aria-hidden="true" />
                                Xem trước bài viết
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsPreviewOpen(false)}
                                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                                aria-label="Đóng xem trước"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto overscroll-contain bg-white p-6 md:p-10">
                            <div className="mx-auto max-w-4xl">
                                <div className="mb-10 text-center">
                                    <span className="mb-4 inline-block border-b-2 border-secret-wax pb-1 text-sm font-bold uppercase tracking-widest text-secret-wax">
                                        {formData.category || 'Tin tức'}
                                    </span>
                                    <h1 className="mb-6 font-serif text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
                                        {formData.title || 'Tiêu đề bài viết'}
                                    </h1>
                                    <p className="mb-6 italic text-gray-500">{formData.excerpt}</p>
                                    {formData.thumbnailUrl && (
                                        <div className="mb-8 overflow-hidden rounded-xl shadow-lg">
                                            <img
                                                src={formData.thumbnailUrl}
                                                alt={formData.thumbnailAlt || formData.title || 'Ảnh bìa bài viết'}
                                                className="h-auto w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: formData.content }} />
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminPosts;
