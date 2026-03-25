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
    where
} from 'firebase/firestore';
import { Edit, Trash2, Plus, X, Search, FolderOpen, Save } from 'lucide-react';
import { db } from '../../firebase';

const AdminCategories = ({ hideHeader = false, searchQuery: externalSearchQuery = "" }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);

    // Fetch Categories
    const fetchCategories = async () => {
        try {
            const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            showToast("Lỗi khi tải danh mục", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Helpers
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'name' && { slug: generateSlug(value) })
        }));
    };

    const handleAddNew = () => {
        setEditingCategory(null);
        setFormData({ name: '', slug: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, slug: category.slug });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await updateDoc(doc(db, 'categories', editingCategory.id), {
                    name: formData.name,
                    slug: formData.slug,
                    updatedAt: Date.now()
                });
                showToast("Cập nhật danh mục thành công!");
            } else {
                await addDoc(collection(db, 'categories'), {
                    name: formData.name,
                    slug: formData.slug,
                    createdAt: Date.now()
                });
                showToast("Thêm danh mục thành công!");
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            console.error("Error saving category:", error);
            showToast("Lỗi khi lưu danh mục", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        try {
            await deleteDoc(doc(db, 'categories', id));
            showToast("Xóa danh mục thành công!");
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting category:", error);
            showToast("Lỗi khi xóa danh mục", "error");
        }
    };

    const effectiveSearchTerm = hideHeader ? externalSearchQuery : searchTerm;
    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-8 lg:px-12 lg:py-16 space-y-12">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {toast.message}
                </div>
            )}

            {!hideHeader && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chuyên mục</h1>
                        <p className="mt-1 text-sm text-slate-500">Phân loại khóa học giúp học viên dễ dàng tìm kiếm</p>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="inline-flex items-center gap-2 rounded-xl bg-secret-wax px-5 py-2.5 text-sm font-bold text-white transition-all shadow-sm hover:bg-secret-ink hover:shadow-md active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Thêm chuyên mục
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {!hideHeader && (
                    <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                        <div className="relative group max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-secret-wax transition-colors" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm chuyên mục..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-secret-wax focus:ring-4 focus:ring-secret-wax/5 transition-all text-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-slate-500 uppercase font-bold tracking-wider bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Tên chuyên mục</th>
                                <th className="px-6 py-4">Slug (Đường dẫn)</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-secret-wax border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium">Đang tải...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCategories.length > 0 ? (
                                filteredCategories.map((category) => (
                                    <tr key={category.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-secret-wax transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-secret-wax/20 group-hover:bg-secret-wax transition-colors"></div>
                                                {category.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                                            /{category.slug}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                                                    title="Sửa"
                                                >
                                                    <Edit className="w-4.5 h-4.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-slate-50 rounded-2xl text-slate-300">
                                                <FolderOpen className="h-8 w-8" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-400">
                                                {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có chuyên mục nào.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingCategory ? 'Sửa chuyên mục' : 'Thêm chuyên mục mới'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Tên chuyên mục <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-secret-wax focus:ring-1 focus:ring-secret-wax/20"
                                    placeholder="VD: Marketing, Đầu tư..."
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Slug (Tự động)</label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 focus:outline-none"
                                    placeholder="marketing, dau-tu..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-bold text-white bg-secret-wax hover:bg-secret-ink rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Lưu lại
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
