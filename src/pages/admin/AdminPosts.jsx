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
} from 'firebase/firestore';
import { Edit, Trash2, Plus, X, FileText, Image as ImageIcon, Upload } from 'lucide-react';

import { db } from '../../firebase';
import RichTextEditor from '../../components/RichTextEditor';
import ArticleEditor from '../../components/admin/editor/ArticleEditor';
import BlockContentRenderer from '../../components/BlockContentRenderer'; // Import Renderer
import { uploadToCloudinary } from "../../utils/uploadService";
import { useMemo, useRef } from 'react'; // Add useRef
import { Eye } from 'lucide-react'; // Add Eye icon

const AdminPosts = () => {
    const [posts, setPosts] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Preview state
    const [editingPost, setEditingPost] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [toast, setToast] = useState(null);

    const editorRef = useRef(null); // Ref for E-Magazine Editor

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
        isBlockMode: false,
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
                .filter(post => {
                    const knowledgeCategories = [
                        "Luật Nhân Quả & Luật Hấp Dẫn",
                        "Tiềm Thức & Tái Lập Trình Niềm Tin",
                        "Chữa Lành Nội Tâm & Đứa Trẻ Bên Trong",
                        "Thiền Dẫn & Thực Hành Năng Lượng",
                        "Năng Lượng Tiền & Thịnh Vượng",
                        "Mục Tiêu – Kỷ Luật – Hiệu Suất",
                        "Kinh Doanh Bằng Bản Thể & Giá Trị",
                        "Video Podcast Đồng Hành"
                    ];
                    // Filter OUT Knowledge posts AND Testimonials
                    return (!post.category || !knowledgeCategories.includes(post.category)) &&
                        (!post.category || !post.category.includes('Cảm nhận'));
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
            category: 'Tin tức',
            author: 'Mong Coaching',
            thumbnailUrl: '',
            videoUrl: '',
            excerpt: '',
            content: '',
            seoTitle: '',
            seoDescription: '',
            seoKeywords: '',
            isPublished: true,
            isBlockMode: false,
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
            category: post.category || 'Tin tức',
            author: post.author || 'Mong Coaching',
            thumbnailUrl: post.thumbnailUrl || '',
            videoUrl: post.videoUrl || '',
            excerpt: post.excerpt || '',
            content: post.content || '',
            seoTitle: post.seoTitle || '',
            seoDescription: post.seoDescription || '',
            seoKeywords: post.seoKeywords || '',
            isPublished: post.isPublished !== undefined ? post.isPublished : true,
            isBlockMode: typeof post.content === 'string' && post.content.trim().startsWith('{'),
        });
        setIsUploadingImage(false);
        setIsFormOpen(true);
    };

    // Submit form (add or update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let finalContent = formData.content;

            // AUTO-SAVE: If in Block Mode, get data from Editor.js
            if (formData.isBlockMode && editorRef.current) {
                const savedData = await editorRef.current.save();
                finalContent = JSON.stringify(savedData);
                // Also update local state to stay in sync
                setFormData(prev => ({ ...prev, content: finalContent }));
            }

            const postData = {
                ...formData,
                content: finalContent, // Use the fresh content
                updatedAt: Date.now(),
            };

            if (editingPost) {
                await updateDoc(doc(db, 'posts', editingPost.id), postData);
                showToast('Cập nhật bài viết thành công!');
            } else {
                await addDoc(collection(db, 'posts'), {
                    ...postData,
                    createdAt: Date.now(),
                });
                showToast('Đăng bài viết thành công!');
            }
            setIsFormOpen(false);
            fetchPosts();
        } catch (error) {
            console.error('Error saving post:', error);
            showToast('Lỗi khi lưu bài viết', 'error');
        } finally {
            setIsSubmitting(false);
            // Don't auto-close if error, but here we assume close on success or handle error above
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
            article: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Bài viết' },
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
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Tin Tức & Sự Kiện</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Tạo, chỉnh sửa và quản lý nội dung blog
                    </p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-2 rounded-lg bg-secret-wax px-4 py-2 text-sm font-semibold text-white transition hover:bg-secret-ink"
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
                                    Phân loại
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Trạng thái
                                </th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Danh mục
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
                                                src={post.thumbnailUrl || "https://placehold.co/600x400?text=Mali+Edu"}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://placehold.co/600x400?text=Mali+Edu";
                                                }}
                                                alt={post.title}
                                                className="h-12 w-16 rounded-lg object-cover"
                                            />
                                        </td>
                                        <td className="py-4">
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="text-sm font-medium text-slate-900 hover:text-secret-wax"
                                            >
                                                {post.title}
                                            </button>
                                        </td>
                                        <td className="py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}
                                            >
                                                {typeBadge.label}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                                            >
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
                                    <td colSpan="6" className="py-12 text-center text-sm text-slate-500">
                                        Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!
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
                                {editingPost ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
                            </h2>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className={`grid gap-6 ${formData.isBlockMode ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
                                {/* Left Column - Content */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-slate-900">Nội dung bài viết</h3>

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
                                            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-lg font-semibold focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
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
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-mono focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
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
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            placeholder="Tóm tắt ngắn gọn về nội dung bài viết..."
                                            required
                                        />
                                    </div>

                                    {/* Rich Text Content */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Nội dung chi tiết <span className="text-red-500">*</span>
                                        </label>
                                        <div className="rounded-lg border border-slate-200">
                                            <div className="flex items-center justify-end p-2 border-b border-slate-100 bg-slate-50 gap-2">
                                                <span className="text-xs text-slate-500 font-medium mr-2">Chế độ soạn thảo:</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, isBlockMode: false }))}
                                                    className={`px-3 py-1 text-xs font-bold rounded ${!formData.isBlockMode ? 'bg-white text-blue-600 shadow-sm border' : 'text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    Cổ điển (HTML)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, isBlockMode: true }))}
                                                    className={`px-3 py-1 text-xs font-bold rounded ${formData.isBlockMode ? 'bg-white text-purple-600 shadow-sm border' : 'text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    E-Magazine (Blocks)
                                                </button>
                                            </div>

                                            {formData.isBlockMode ? (
                                                <div className="p-4">
                                                    <div className="mb-4 bg-purple-50 text-purple-700 p-3 rounded-lg text-sm flex items-center justify-between">
                                                        <div className="flex items-start gap-2">
                                                            <span>✨</span>
                                                            <div>
                                                                <strong>Chế độ E-Magazine:</strong> Tự động lưu khi bấm "Đăng bài".
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (editorRef.current) {
                                                                    const data = await editorRef.current.save();
                                                                    setFormData(prev => ({ ...prev, content: JSON.stringify(data) }));
                                                                    setIsPreviewOpen(true);
                                                                }
                                                            }}
                                                            className="flex items-center gap-1 bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors shadow-sm"
                                                        >
                                                            <Eye className="w-3 h-3" /> Xem trước
                                                        </button>
                                                    </div>
                                                    <ArticleEditor
                                                        ref={editorRef}
                                                        initialData={(() => {
                                                            try {
                                                                return formData.content ? JSON.parse(formData.content) : {}
                                                            } catch (e) {
                                                                return {}
                                                            }
                                                        })()}
                                                    />
                                                </div>
                                            ) : (
                                                <RichTextEditor
                                                    value={formData.content}
                                                    onChange={handleContentChange}
                                                    placeholder="Viết nội dung bài viết tại đây..."
                                                />
                                            )}
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

                                    {/* Type */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Loại bài viết <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            required
                                        >
                                            <option value="article">Bài viết</option>
                                            <option value="video">Video</option>
                                            <option value="case-study">Kết quả học viên</option>
                                        </select>
                                    </div>

                                    {/* Author */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Người viết bài
                                        </label>
                                        <input
                                            type="text"
                                            name="author"
                                            value={formData.author}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            placeholder="Mong Coaching"
                                        />
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

                                    {/* Video URL - Only for videos */}
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
                                                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                                placeholder="https://www.youtube.com/embed/..."
                                                required={formData.type === 'video'}
                                            />
                                            <p className="text-xs text-slate-500">
                                                YouTube embed URL hoặc Cloudinary video URL
                                            </p>
                                        </div>
                                    )}

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Danh mục <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            required
                                        >
                                            <option value="">-- Chọn danh mục --</option>
                                            <option value="Tin tức chung">Tin tức chung</option>
                                            <option value="Sự kiện & Hoạt động">Sự kiện & Hoạt động</option>
                                            <option value="Thông báo Lịch học">Thông báo Lịch học</option>
                                            <option value="Góc Báo chí">Góc Báo chí</option>
                                        </select>
                                    </div>

                                    {/* Author */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Tác giả</label>
                                        <input
                                            type="text"
                                            name="author"
                                            value={formData.author}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
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
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.isPublished ? 'bg-secret-wax' : 'bg-gray-300'
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
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-secret-wax px-6 py-2 text-sm font-semibold text-white hover:bg-secret-ink disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Đang lưu...' : editingPost ? 'Cập nhật' : 'Đăng bài'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
                    <div className="w-full max-w-5xl h-[90vh] bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-fade-in-up">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-secret-wax" /> Xem trước bài viết
                            </h3>
                            <button
                                onClick={() => setIsPreviewOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto bg-white p-6 md:p-10">
                            <div className="max-w-4xl mx-auto">
                                {/* Simulated Header */}
                                <div className="text-center mb-10">
                                    <span className="text-sm font-bold text-secret-wax uppercase tracking-widest border-b-2 border-secret-wax pb-1 mb-4 inline-block">
                                        {formData.category || 'Tin tức'}
                                    </span>
                                    <h1 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                        {formData.title || 'Tiêu đề bài viết'}
                                    </h1>
                                    <p className="text-gray-500 italic mb-6">{formData.excerpt}</p>

                                    {formData.thumbnailUrl && (
                                        <div className="rounded-xl overflow-hidden shadow-lg mb-8">
                                            <img src={formData.thumbnailUrl} alt="" className="w-full h-auto" />
                                        </div>
                                    )}
                                </div>

                                {/* Render Content */}
                                {formData.isBlockMode ? (
                                    <BlockContentRenderer
                                        data={(() => {
                                            try {
                                                return typeof formData.content === 'string' ? JSON.parse(formData.content) : formData.content;
                                            } catch (e) {
                                                return { blocks: [] };
                                            }
                                        })()}
                                    />
                                ) : (
                                    <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: formData.content }} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPosts;
