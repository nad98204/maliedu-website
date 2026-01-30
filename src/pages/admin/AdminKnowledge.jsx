import { useEffect, useState } from 'react';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import { Edit, Trash2, Plus, X, BookOpen, Image as ImageIcon, Upload } from 'lucide-react';

import { db } from '../../firebase';
import RichTextEditor from '../../components/RichTextEditor';
import { uploadToCloudinary } from "../../utils/uploadService";

const KNOWLEDGE_CATEGORIES = [
    "Luật Nhân Quả & Luật Hấp Dẫn",
    "Tiềm Thức & Tái Lập Trình Niềm Tin",
    "Chữa Lành Nội Tâm & Đứa Trẻ Bên Trong",
    "Thiền Dẫn & Thực Hành Năng Lượng",
    "Năng Lượng Tiền & Thịnh Vượng",
    "Mục Tiêu – Kỷ Luật – Hiệu Suất",
    "Kinh Doanh Bằng Bản Thể & Giá Trị",
    "Video Podcast Đồng Hành"
];

const AdminKnowledge = () => {
    const [posts, setPosts] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [toast, setToast] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        type: 'article',
        category: '',
        author: 'Mong Coaching',
        thumbnailUrl: '',
        videoUrl: '',
        excerpt: '',
        content: '',
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        isPublished: true,
    });

    // Fetch posts from Firebase
    const fetchPosts = async () => {
        try {
            const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(postsQuery);
            const postsData = snapshot.docs
                .map((docItem) => ({
                    id: docItem.id,
                    ...docItem.data(),
                }))
                .filter(post => KNOWLEDGE_CATEGORIES.includes(post.category));
            setPosts(postsData);
        } catch (error) {
            console.error('Error fetching posts:', error);
            showToast('Không thể tải bài viết', 'error');
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    // Auto-generate slug from title
    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Auto-generate slug when title changes
            ...(name === 'title' && { slug: generateSlug(value) }),
        }));
    };

    // Handle Rich Text Editor change
    const handleContentChange = (value) => {
        setFormData((prev) => ({ ...prev, content: value }));
    };

    const handleImageUpload = async (event) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.type.startsWith("image/")) {
            showToast("Vui lòng chọn file ảnh hợp lệ", "error");
            return;
        }

        setIsUploadingImage(true);
        try {
            const uploadResult = await uploadToCloudinary(selectedFile);
            setFormData(prev => ({ ...prev, thumbnailUrl: uploadResult.secureUrl }));
            showToast("Tải ảnh bìa thành công!");
        } catch (error) {
            console.error("Lỗi upload:", error);
            showToast("Lỗi khi tải ảnh lên", "error");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, thumbnailUrl: '' }));
    };

    // Open form for new post
    const handleAddNew = () => {
        setEditingPost(null);
        setFormData({
            title: '',
            slug: '',
            type: 'article',
            category: KNOWLEDGE_CATEGORIES[0],
            author: 'Mong Coaching',
            thumbnailUrl: '',
            videoUrl: '',
            excerpt: '',
            content: '',
            seoTitle: '',
            seoDescription: '',
            seoKeywords: '',
            isPublished: true,
        });
        setIsUploadingImage(false);
        setIsFormOpen(true);
    };

    // Open form for editing post
    const handleEdit = (post) => {
        setEditingPost(post);
        setFormData({
            title: post.title || '',
            slug: post.slug || '',
            type: post.type || 'article',
            category: post.category || KNOWLEDGE_CATEGORIES[0],
            author: post.author || 'Mong Coaching',
            thumbnailUrl: post.thumbnailUrl || '',
            videoUrl: post.videoUrl || '',
            excerpt: post.excerpt || '',
            content: post.content || '',
            seoTitle: post.seoTitle || '',
            seoDescription: post.seoDescription || '',
            seoKeywords: post.seoKeywords || '',
            isPublished: post.isPublished !== undefined ? post.isPublished : true,
        });
        setIsUploadingImage(false);
        setIsFormOpen(true);
    };

    // Submit form (add or update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const postData = {
                ...formData,
                updatedAt: Date.now(),
            };

            if (editingPost) {
                // Update existing post
                await updateDoc(doc(db, 'posts', editingPost.id), postData);
                showToast('Cập nhật cảm nhận bài học thành công!');
            } else {
                // Create new post
                await addDoc(collection(db, 'posts'), {
                    ...postData,
                    createdAt: Date.now(),
                });
                showToast('Đăng bài học mới thành công!');
            }

            setIsFormOpen(false);
            fetchPosts();
        } catch (error) {
            console.error('Error saving post:', error);
            showToast('Lỗi khi lưu bài viết', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete post
    const handleDelete = async (postId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'posts', postId));
            setPosts((prev) => prev.filter((post) => post.id !== postId));
            showToast('Xóa bài viết thành công!');
        } catch (error) {
            console.error('Error deleting post:', error);
            showToast('Lỗi khi xóa bài viết', 'error');
        }
    };

    // Get type badge styling
    const getTypeBadge = (type) => {
        const badges = {
            video: { bg: 'bg-red-100', text: 'text-red-700', label: 'Video' },
            'case-study': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Success Story' },
            article: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Bài viết' },
        };
        return badges[type] || badges.article;
    };

    // Get status badge styling
    const getStatusBadge = (isPublished) => {
        return isPublished
            ? { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã xuất bản' }
            : { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Bản nháp' };
    };

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                        }`}
                >
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản Lý Kho Kiến Thức</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        8 Trụ Cột Kiến Thức Chuyên Sâu
                    </p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Thêm bài viết mới
                </button>
            </div>

            {/* Posts Table */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-200">
                            <tr>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Ảnh
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Tiêu đề
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Danh mục
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Trạng thái
                                </th>
                                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {posts.map((post) => {
                                const typeBadge = getTypeBadge(post.type);
                                const statusBadge = getStatusBadge(post.isPublished);

                                return (
                                    <tr key={post.id} className="hover:bg-slate-50">
                                        <td className="py-4">
                                            <img
                                                src={post.thumbnailUrl}
                                                alt={post.title}
                                                className="h-12 w-16 rounded-lg object-cover"
                                            />
                                        </td>
                                        <td className="py-4">
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="text-sm font-medium text-slate-900 hover:text-indigo-600"
                                            >
                                                {post.title}
                                            </button>
                                        </td>
                                        <td className="py-4 text-sm text-slate-600">{post.category}</td>
                                        <td className="py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                                            >
                                                {statusBadge.label}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(post)}
                                                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                                    title="Sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {posts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-sm text-slate-500">
                                        Chưa có bài viết nào trong Kho Kiến Thức.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingPost ? 'Chỉnh sửa kiến thức' : 'Thêm kiến thức mới'}
                            </h2>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Left Column - Content */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-slate-900">Nội dung</h3>

                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Tiêu đề <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-lg font-semibold focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="Nhập tiêu đề bài viết"
                                            required
                                        />
                                    </div>

                                    {/* Slug */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Slug (URL) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="slug-bai-viet"
                                            required
                                        />
                                        <p className="text-xs text-slate-500">
                                            URL: /tin-tuc/{formData.slug || 'slug-bai-viet'}
                                        </p>
                                    </div>

                                    {/* Excerpt */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Mô tả ngắn <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="excerpt"
                                            value={formData.excerpt}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="Tóm tắt ngắn gọn..."
                                            required
                                        />
                                    </div>

                                    {/* Rich Text Content */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Nội dung chi tiết <span className="text-red-500">*</span>
                                        </label>
                                        <div className="rounded-lg border border-slate-200">
                                            <RichTextEditor
                                                value={formData.content}
                                                onChange={handleContentChange}
                                                placeholder="Viết nội dung bài viết tại đây..."
                                            />
                                        </div>
                                    </div>

                                    {/* SEO Section */}
                                    <div className="pt-6 border-t border-slate-200 space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-900">Tối Ưu Hóa Tìm Kiếm (SEO)</h3>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">SEO Title</label>
                                            <input
                                                type="text"
                                                name="seoTitle"
                                                value={formData.seoTitle}
                                                onChange={handleInputChange}
                                                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                                placeholder="Tiêu đề hiển thị trên Google (Nếu khác tiêu đề bài)..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">SEO Description</label>
                                            <textarea
                                                name="seoDescription"
                                                value={formData.seoDescription}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                                placeholder="Mô tả ngắn gọn nội dung bài viết (Khoảng 150 ký tự)..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">SEO Keywords</label>
                                            <input
                                                type="text"
                                                name="seoKeywords"
                                                value={formData.seoKeywords}
                                                onChange={handleInputChange}
                                                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                                placeholder="tư duy, luật hấp dẫn, mong coaching..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Configuration & Media */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-slate-900">Cấu hình & Media</h3>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Danh mục 8 Trụ Cột <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            required
                                        >
                                            <option value="">-- Chọn danh mục --</option>
                                            {KNOWLEDGE_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Type */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Loại bài viết <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            required
                                        >
                                            <option value="article">Bài viết</option>
                                            <option value="video">Video</option>
                                            <option value="case-study">Kết quả học viên</option>
                                        </select>
                                    </div>

                                    {/* Thumbnail URL - Hybrid Upload */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-slate-700">
                                            Ảnh bìa bài viết <span className="text-red-500">*</span>
                                        </label>

                                        {/* 1. Upload Area */}
                                        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-secret-wax transition-colors bg-slate-50 relative">
                                            <div className="space-y-1 text-center">
                                                {isUploadingImage ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 border-4 border-secret-wax border-t-transparent rounded-full animate-spin mb-2"></div>
                                                        <p className="text-xs text-slate-500">Đang tải lên...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex text-sm text-slate-600 justify-center">
                                                            <label
                                                                htmlFor="post-image-upload"
                                                                className="relative cursor-pointer bg-white rounded-md font-medium text-secret-wax hover:text-secret-ink focus-within:outline-none"
                                                            >
                                                                <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Tải ảnh từ máy</span>
                                                                <input id="post-image-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                                            </label>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* 2. Manual URL Input */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <ImageIcon className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="url"
                                                name="thumbnailUrl"
                                                value={formData.thumbnailUrl}
                                                onChange={handleInputChange}
                                                className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 placeholder:text-slate-400"
                                                placeholder="Hoặc dán đường dẫn ảnh (Facebook, Cloudinary)..."
                                                required
                                            />
                                        </div>

                                        {/* 3. Preview Area */}
                                        {formData.thumbnailUrl && (
                                            <div className="relative rounded-lg overflow-hidden group border border-slate-200 bg-slate-100">
                                                <img
                                                    src={formData.thumbnailUrl}
                                                    alt="Preview"
                                                    className="h-48 w-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL'; }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveImage}
                                                        className="bg-white/90 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-1 shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Xóa ảnh
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Video URL */}
                                    {formData.type === 'video' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                URL Video <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="url"
                                                name="videoUrl"
                                                value={formData.videoUrl}
                                                onChange={handleInputChange}
                                                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                placeholder="https://www.youtube.com/embed/..."
                                                required
                                            />
                                        </div>
                                    )}

                                    {/* Author */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Tác giả</label>
                                        <input
                                            type="text"
                                            name="author"
                                            value={formData.author}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>

                                    {/* Publish Toggle */}
                                    <div className="rounded-lg border border-slate-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">Hiển thị ngay</div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    {formData.isPublished
                                                        ? 'Bài viết sẽ hiển thị công khai'
                                                        : 'Lưu dưới dạng bản nháp'}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({ ...prev, isPublished: !prev.isPublished }))
                                                }
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.isPublished ? 'bg-indigo-600' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.isPublished ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-200 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Đang lưu...' : editingPost ? 'Cập nhật' : 'Đăng bài'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminKnowledge;
