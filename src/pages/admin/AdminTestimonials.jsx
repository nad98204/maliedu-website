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
import { Edit, Trash2, Plus, X, Image as ImageIcon, Upload, MessageSquare } from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

import { db } from '../../firebase';
import RichTextEditor from '../../components/RichTextEditor';
import { deleteFromCloudinary, uploadToCloudinary } from "../../utils/uploadService";

const AdminTestimonials = () => {
    // Tab State
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'backgrounds'

    // --- SHARED STATE ---
    const [toast, setToast] = useState(null);

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- POSTS MANAGER STATE & LOGIC ---
    const [posts, setPosts] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    const [isSubmittingPost, setIsSubmittingPost] = useState(false);
    const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);

    const [postFormData, setPostFormData] = useState({
        title: '',
        slug: '',
        type: 'article',
        category: '',
        author: 'Mong Coaching',
        thumbnailUrl: '',
        facebookLink: '',
        videoUrl: '',
        excerpt: '',
        content: '',
        isPublished: true,
        // New fields for Homepage
        role: '',
        headline: '',
        statsLabel: '',
        isFeatured: false,
    });

    const fetchPosts = async () => {
        try {
            const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(postsQuery);
            const postsData = snapshot.docs
                .map((docItem) => ({
                    id: docItem.id,
                    ...docItem.data(),
                }))
                .filter(post => post.category && post.category.includes('Cảm nhận'));
            setPosts(postsData);
        } catch (error) {
            console.error('Error fetching posts:', error);
            showToast('Không thể tải bài viết', 'error');
        }
    };

    // --- BACKGROUNDS MANAGER STATE & LOGIC ---
    const [backgroundImages, setBackgroundImages] = useState([]);
    const [bgFile, setBgFile] = useState(null);
    const [bgCategory, setBgCategory] = useState("default");
    const [isSubmittingBg, setIsSubmittingBg] = useState(false);
    const [bgError, setBgError] = useState("");

    const BG_CATEGORIES = [
        { value: "default", label: "Mặc định (Hiện tất cả trang)" },
        { value: "vut-toc-muc-tieu", label: "Vút Tốc Mục Tiêu" },
        { value: "luat-hap-dan", label: "Luật Hấp Dẫn" },
    ];

    const fetchBackgroundImages = async () => {
        try {
            const q = query(collection(db, "hero_images"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data(),
            }));
            setBackgroundImages(items);
        } catch (err) {
            console.error("Lỗi khi tải ảnh nền:", err);
            showToast("Không thể tải danh sách ảnh nền.", "error");
        }
    };

    // Initial Data Fetch
    useEffect(() => {
        if (activeTab === 'posts') {
            fetchPosts();
        } else {
            fetchBackgroundImages();
        }
    }, [activeTab]);


    // --- POST HANDLERS ---
    const generateSlug = (title) => {
        return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
    };

    const handlePostInputChange = (e) => {
        const { name, value } = e.target;
        setPostFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'title' && { slug: generateSlug(value) }),
        }));
    };

    const handlePostContentChange = (value) => {
        setPostFormData((prev) => ({ ...prev, content: value }));
    };

    const handleAddNewPost = () => {
        setEditingPost(null);
        setPostFormData({
            title: '',
            slug: '',
            type: 'article',
            category: '',
            author: 'Mong Coaching',
            thumbnailUrl: '',
            facebookLink: '',
            videoUrl: '',
            excerpt: '',
            content: '',
            isPublished: true,
            role: '',
            headline: '',
            statsLabel: '',
            isFeatured: false,
        });
        setIsUploadingPostImage(false);
        setIsFormOpen(true);
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setPostFormData({
            title: post.title || '',
            slug: post.slug || '',
            type: post.type || 'article',
            category: post.category || '',
            author: post.author || 'Mong Coaching',
            thumbnailUrl: post.thumbnailUrl || '',
            facebookLink: post.facebookLink || '',
            videoUrl: post.videoUrl || '',
            excerpt: post.excerpt || '',
            content: post.content || '',
            isPublished: post.isPublished !== undefined ? post.isPublished : true,
            role: post.role || '',
            headline: post.headline || '',
            statsLabel: post.statsLabel || '',
            isFeatured: post.isFeatured || false,
        });
        setIsUploadingPostImage(false);
        setIsFormOpen(true);
    };

    const handlePostImageUpload = async (event) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.type.startsWith("image/")) {
            showToast("Vui lòng chọn file ảnh hợp lệ", "error");
            return;
        }

        setIsUploadingPostImage(true);
        try {
            const uploadResult = await uploadToCloudinary(selectedFile);
            setPostFormData(prev => ({ ...prev, thumbnailUrl: uploadResult.secureUrl }));
            showToast("Tải ảnh bìa thành công!");
        } catch (error) {
            console.error("Lỗi upload:", error);
            showToast("Lỗi khi tải ảnh lên", "error");
        } finally {
            setIsUploadingPostImage(false);
        }
    };

    const handleRemovePostImage = () => {
        setPostFormData(prev => ({ ...prev, thumbnailUrl: '' }));
    };

    const handleSubmitPost = async (e) => {
        e.preventDefault();
        setIsSubmittingPost(true);
        try {
            const postData = {
                ...postFormData,
                videoUrl: postFormData.videoUrl,
                updatedAt: Date.now(),
            };

            if (editingPost) {
                await updateDoc(doc(db, 'posts', editingPost.id), postData);
                showToast('Cập nhật cảm nhận thành công!');
            } else {
                await addDoc(collection(db, 'posts'), {
                    ...postData,
                    createdAt: Date.now(),
                });
                showToast('Đăng cảm nhận thành công!');
            }
            setIsFormOpen(false);
            fetchPosts();
        } catch (error) {
            console.error('Error saving post:', error);
            showToast('Lỗi khi lưu bài viết', 'error');
        } finally {
            setIsSubmittingPost(false);
        }
    };

    const handleDeletePost = async (postId) => {
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

    // --- BACKGROUND HANDLERS ---
    const handleBgFileChange = (event) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith("image/")) {
                setBgError("Vui lòng chọn file ảnh hợp lệ.");
                setBgFile(null);
                return;
            }
            setBgFile(selectedFile);
            setBgError("");
        }
    };

    const handleUploadBg = async (event) => {
        event.preventDefault();
        setBgError("");
        if (!bgFile) {
            setBgError("Vui lòng chọn ảnh để tải lên.");
            return;
        }

        setIsSubmittingBg(true);
        try {
            const uploadResult = await uploadToCloudinary(bgFile);
            await addDoc(collection(db, "hero_images"), {
                imageUrl: uploadResult.secureUrl,
                category: bgCategory,
                deleteToken: uploadResult.deleteToken || null,
                publicId: uploadResult.publicId || null,
                createdAt: Date.now(),
            });

            setBgFile(null);
            const fileInput = document.getElementById("file-upload-bg");
            if (fileInput) fileInput.value = "";
            showToast("Tải ảnh nền thành công!");
            await fetchBackgroundImages();
        } catch (err) {
            console.error("Lỗi upload:", err);
            setBgError("Không thể tải ảnh lên. Vui lòng thử lại.");
        } finally {
            setIsSubmittingBg(false);
        }
    };

    const handleDeleteBg = async (imageId, deleteToken) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;
        try {
            await deleteDoc(doc(db, "hero_images", imageId));
            if (deleteToken) await deleteFromCloudinary(deleteToken);
            setBackgroundImages((prev) => prev.filter((img) => img.id !== imageId));
            showToast("Xóa ảnh thành công!");
        } catch (err) {
            console.error("Lỗi xóa ảnh:", err);
            showToast("Không thể xóa ảnh.", "error");
        }
    };

    const getBgCategoryLabel = (catValue) => {
        return BG_CATEGORIES.find(c => c.value === catValue)?.label || catValue;
    };

    // --- HELPERS ---
    const getTypeBadge = (type) => {
        const badges = {
            video: { bg: 'bg-red-100', text: 'text-red-700', label: 'Video' },
            'case-study': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Success Story' },
            article: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Bài viết' },
        };
        return badges[type] || badges.article;
    };

    const getStatusBadge = (isPublished) => {
        return isPublished
            ? { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã xuất bản' }
            : { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Bản nháp' };
    };

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý Cảm Nhận Học Viên</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Quản lý các bài viết review, kết quả và ảnh nền timeline.
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium ${activeTab === 'posts'
                            ? 'border-secret-wax text-secret-wax'
                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                            }`}
                    >
                        <MessageSquare className={`mr-2 h-5 w-5 ${activeTab === 'posts' ? 'text-secret-wax' : 'text-slate-400 group-hover:text-slate-500'}`} />
                        Danh sách Feedback
                    </button>
                    <button
                        onClick={() => setActiveTab('backgrounds')}
                        className={`group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium ${activeTab === 'backgrounds'
                            ? 'border-secret-wax text-secret-wax'
                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                            }`}
                    >
                        <ImageIcon className={`mr-2 h-5 w-5 ${activeTab === 'backgrounds' ? 'text-secret-wax' : 'text-slate-400 group-hover:text-slate-500'}`} />
                        Ảnh Nền Timeline
                    </button>
                </nav>
            </div>

            {/* Tab Content: POSTS */}
            {activeTab === 'posts' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={handleAddNewPost}
                            className="inline-flex items-center gap-2 rounded-lg bg-secret-wax px-4 py-2 text-sm font-semibold text-white transition hover:bg-secret-ink"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm cảm nhận mới
                        </button>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
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
                                                    <button onClick={() => handleEditPost(post)} className="text-sm font-medium text-slate-900 hover:text-secret-wax">
                                                        {post.title}
                                                    </button>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>{typeBadge.label}</span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>{statusBadge.label}</span>
                                                </td>
                                                <td className="py-4 text-sm text-slate-600">
                                                    {post.category}
                                                    {post.isFeatured && (
                                                        <span className="ml-2 inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Featured</span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleEditPost(post)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title="Sửa"><Edit className="h-4 w-4" /></button>
                                                        <button onClick={() => handleDeletePost(post.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Xóa"><Trash2 className="h-4 w-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {posts.length === 0 && (
                                        <tr><td colSpan="6" className="py-12 text-center text-sm text-slate-500">Chưa có bài viết cảm nhận nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content: BACKGROUNDS */}
            {activeTab === 'backgrounds' && (
                <div className="space-y-8">
                    {/* Upload Form */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="border-b border-slate-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Upload Ảnh Mới</h2>
                            <p className="text-sm text-slate-500">Tải lên ảnh hiển thị ở phần Hero (Slide cuộn phim).</p>
                        </div>

                        <form onSubmit={handleUploadBg} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="grid gap-6 md:grid-cols-[1fr,1fr,auto] items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Chọn Ảnh</label>
                                    <input
                                        id="file-upload-bg"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBgFileChange}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Chọn trang áp dụng</label>
                                    <select
                                        value={bgCategory}
                                        onChange={(e) => setBgCategory(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    >
                                        {BG_CATEGORIES.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmittingBg || !bgFile}
                                    className="px-6 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-[42px]"
                                >
                                    {isSubmittingBg ? "Đang tải..." : "Tải lên ngay"}
                                </button>
                            </div>
                            {bgError && <p className="mt-3 text-sm text-red-500">{bgError}</p>}
                        </form>
                    </div>

                    {/* Gallery */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {backgroundImages.map((img) => (
                            <div key={img.id} className="group relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                                    <img src={img.imageUrl} alt="Hero Background" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                </div>
                                <div className="p-3">
                                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${img.category === 'default' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                        {getBgCategoryLabel(img.category)}
                                    </span>
                                    <div className="mt-2 text-xs text-slate-400">{new Date(img.createdAt).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDeleteBg(img.id, img.deleteToken)} className="p-2 bg-white/90 text-red-600 rounded-full shadow-sm hover:bg-red-50 transition-colors" title="Xóa ảnh">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {backgroundImages.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                            <ThemeIconPlaceholder />
                            <h3 className="text-slate-900 font-medium">Chưa có ảnh nào</h3>
                            <p className="text-slate-500 text-sm mt-1">Hãy tải lên ảnh đầu tiên cho slide hero.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal for Posts (Reused) */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                            <h2 className="text-xl font-bold text-slate-900">{editingPost ? 'Chỉnh sửa cảm nhận' : 'Thêm cảm nhận mới'}</h2>
                            <button onClick={() => setIsFormOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSubmitPost} className="p-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-slate-900">Nội dung bài viết</h3>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Tiêu đề <span className="text-red-500">*</span></label>
                                        <input type="text" name="title" value={postFormData.title} onChange={handlePostInputChange} className="w-full rounded-lg border border-slate-200 px-4 py-3 text-lg font-semibold focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" placeholder="Tiêu đề cảm nhận..." required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Slug (URL) <span className="text-red-500">*</span></label>
                                        <input type="text" name="slug" value={postFormData.slug} onChange={handlePostInputChange} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-mono focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Mô tả ngắn <span className="text-red-500">*</span></label>
                                        <textarea name="excerpt" value={postFormData.excerpt} onChange={handlePostInputChange} rows="3" className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Nội dung chi tiết <span className="text-red-500">*</span></label>
                                        <div className="rounded-lg border border-slate-200">
                                            <RichTextEditor value={postFormData.content} onChange={handlePostContentChange} placeholder="Viết chi tiết..." />
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-semibold text-slate-900">Thông tin hiển thị trên Homepage</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Chức vụ / Nghề nghiệp</label>
                                                <input type="text" name="role" value={postFormData.role} onChange={handlePostInputChange} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Tiêu đề nổi bật (Headline)</label>
                                                <input type="text" name="headline" value={postFormData.headline} onChange={handlePostInputChange} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" placeholder="VD: X2 thu nhập..." />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <label className="text-sm font-medium text-slate-700">Con số ấn tượng (Stats Label)</label>
                                                <input type="text" name="statsLabel" value={postFormData.statsLabel} onChange={handlePostInputChange} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" placeholder="VD: +100% doanh thu" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-slate-900">Cấu hình & Media</h3>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Loại bài viết <span className="text-red-500">*</span></label>
                                        <select name="type" value={postFormData.type} onChange={handlePostInputChange} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" required>
                                            <option value="article">Bài viết (Wall of Love)</option>
                                            <option value="video">Video Cảm nhận</option>
                                            <option value="case-study">Kết quả học viên (Case Study)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Link bài viết Facebook (Tùy chọn)</label>
                                        <input type="url" name="facebookLink" value={postFormData.facebookLink} onChange={handlePostInputChange} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" placeholder="https://facebook.com/..." />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-slate-700">Ảnh bìa bài viết <span className="text-red-500">*</span></label>

                                        {/* 1. Upload Area */}
                                        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-secret-wax transition-colors bg-slate-50 relative">
                                            <div className="space-y-1 text-center">
                                                {isUploadingPostImage ? (
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
                                                                <input id="post-image-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handlePostImageUpload} />
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
                                                value={postFormData.thumbnailUrl}
                                                onChange={handlePostInputChange}
                                                className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20 placeholder:text-slate-400"
                                                placeholder="Hoặc dán đường dẫn ảnh (Facebook, Cloudinary)..."
                                                required
                                            />
                                        </div>

                                        {/* 3. Preview Area */}
                                        {postFormData.thumbnailUrl && (
                                            <div className="relative rounded-lg overflow-hidden group border border-slate-200 bg-slate-100">
                                                <img
                                                    src={postFormData.thumbnailUrl}
                                                    alt="Preview"
                                                    className="h-48 w-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL'; }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={handleRemovePostImage}
                                                        className="bg-white/90 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-1 shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Xóa ảnh
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Link Video Youtube/TikTok (Embed Link)
                                            {postFormData.type === 'video' && <span className="text-red-500"> *</span>}
                                        </label>
                                        <input
                                            type="url"
                                            name="videoUrl"
                                            value={postFormData.videoUrl}
                                            onChange={handlePostInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            required={postFormData.type === 'video'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Danh mục <span className="text-red-500">*</span></label>
                                        <select name="category" value={postFormData.category} onChange={handlePostInputChange} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" required>
                                            <option value="">-- Chọn danh mục --</option>
                                            <option value="Cảm nhận - Vút tốc mục tiêu">Cảm nhận - Vút tốc mục tiêu</option>
                                            <option value="Cảm nhận - Luật hấp dẫn">Cảm nhận - Luật hấp dẫn</option>
                                            <option value="Cảm nhận - Khác">Cảm nhận - Khác</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Khách hàng/Học viên</label>
                                        <input type="text" name="author" value={postFormData.author} onChange={handlePostInputChange} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-secret-wax focus:ring-2 focus:ring-secret-wax/20" />
                                    </div>
                                    <div className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">Hiển thị ngay</div>
                                            <div className="mt-1 text-xs text-slate-500">{postFormData.isPublished ? 'Bài viết sẽ hiển thị công khai' : 'Lưu dưới dạng bản nháp'}</div>
                                        </div>
                                        <button type="button" onClick={() => setPostFormData((prev) => ({ ...prev, isPublished: !prev.isPublished }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${postFormData.isPublished ? 'bg-secret-wax' : 'bg-gray-300'}`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${postFormData.isPublished ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">Hiển thị Trang Chủ</div>
                                            <div className="mt-1 text-xs text-slate-500">Bài viết sẽ xuất hiện trong phần "Cảm nhận"</div>
                                        </div>
                                        <button type="button" onClick={() => setPostFormData((prev) => ({ ...prev, isFeatured: !prev.isFeatured }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${postFormData.isFeatured ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${postFormData.isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-200 pt-6">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Hủy</button>
                                <button type="submit" disabled={isSubmittingPost} className="rounded-lg bg-secret-wax px-6 py-2 text-sm font-semibold text-white hover:bg-secret-ink disabled:cursor-not-allowed disabled:opacity-50">{isSubmittingPost ? 'Đang lưu...' : editingPost ? 'Cập nhật' : 'Đăng bài'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ThemeIconPlaceholder = () => (
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
        <ImageIcon className="w-6 h-6 text-slate-400" />
    </div>
);

export default AdminTestimonials;
