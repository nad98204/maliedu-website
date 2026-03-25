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
import { Edit, Trash2, Plus, X, Search, Save, User, Mail, ImageIcon, FileText } from 'lucide-react';
import { db } from '../../firebase';

const AdminInstructors = ({ hideHeader = false, searchQuery: externalSearchQuery = "" }) => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        email: '',
        bio: '',
        avatar: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);

    // Fetch Instructors
    const fetchInstructors = async () => {
        try {
            const q = query(collection(db, 'instructors'), orderBy('name', 'asc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setInstructors(data);
        } catch (error) {
            console.error("Error fetching instructors:", error);
            showToast("Lỗi khi tải danh sách giảng viên", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstructors();
    }, []);

    // Helpers
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddNew = () => {
        setEditingInstructor(null);
        setFormData({ name: '', title: '', email: '', bio: '', avatar: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (instructor) => {
        setEditingInstructor(instructor);
        setFormData({
            name: instructor.name || '',
            title: instructor.title || '',
            email: instructor.email || '',
            bio: instructor.bio || '',
            avatar: instructor.avatar || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingInstructor) {
                await updateDoc(doc(db, 'instructors', editingInstructor.id), {
                    ...formData,
                    updatedAt: Date.now()
                });
                showToast("Cập nhật giảng viên thành công!");
            } else {
                await addDoc(collection(db, 'instructors'), {
                    ...formData,
                    createdAt: Date.now()
                });
                showToast("Thêm giảng viên thành công!");
            }
            setIsModalOpen(false);
            fetchInstructors();
        } catch (error) {
            console.error("Error saving instructor:", error);
            showToast("Lỗi khi lưu giảng viên", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa giảng viên này?")) return;
        try {
            await deleteDoc(doc(db, 'instructors', id));
            showToast("Xóa giảng viên thành công!");
            setInstructors(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting instructor:", error);
            showToast("Lỗi khi xóa giảng viên", "error");
        }
    };

    const effectiveSearchTerm = hideHeader ? externalSearchQuery : searchTerm;
    const filteredInstructors = instructors.filter(c =>
        c.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(effectiveSearchTerm.toLowerCase()))
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
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Giảng viên</h1>
                        <p className="mt-1 text-sm text-slate-500">Quản lý chuyên gia và diễn giả trên hệ thống</p>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="inline-flex items-center gap-2 rounded-xl bg-secret-wax px-5 py-2.5 text-sm font-bold text-white transition-all shadow-sm hover:bg-secret-ink hover:shadow-md active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Thêm giảng viên
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
                                placeholder="Tìm kiếm giảng viên theo tên hoặc email..."
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
                                <th className="px-6 py-4">Giảng viên</th>
                                <th className="px-6 py-4">Chức danh / Email</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-secret-wax border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium">Đang tải dữ liệu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredInstructors.length > 0 ? (
                                filteredInstructors.map((instructor) => (
                                    <tr key={instructor.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                  <img
                                                      src={instructor.avatar || 'https://via.placeholder.com/150'}
                                                      alt={instructor.name}
                                                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-100"
                                                  />
                                                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-white shadow-sm"></div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 group-hover:text-secret-wax transition-colors">{instructor.name}</div>
                                                    {instructor.bio && <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[250px] mt-0.5 italic">{instructor.bio}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900 font-semibold">{instructor.title || "—"}</div>
                                            <div className="text-slate-500 text-[11px] mt-0.5">{instructor.email || "Không có email"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(instructor)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                                                    title="Sửa"
                                                >
                                                    <Edit className="w-4.5 h-4.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(instructor.id)}
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
                                                <User className="h-8 w-8" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-400">
                                                {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có giảng viên nào.'}
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
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingInstructor ? 'Sửa thông tin giảng viên' : 'Thêm giảng viên mới'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Tên giảng viên <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-secret-wax focus:ring-1 focus:ring-secret-wax/20"
                                        placeholder="VD: Nguyễn Anh Đăng"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Chức danh / Role</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-secret-wax focus:ring-1 focus:ring-secret-wax/20"
                                    placeholder="VD: Life Coach, Business Trainer..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email liên hệ (Optional)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-secret-wax focus:ring-1 focus:ring-secret-wax/20"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Ảnh đại diện (URL)</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        name="avatar"
                                        value={formData.avatar}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-secret-wax focus:ring-1 focus:ring-secret-wax/20"
                                        placeholder="https://..."
                                    />
                                </div>
                                {formData.avatar && (
                                    <div className="mt-2 flex justify-center">
                                        <img src={formData.avatar} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Tiểu sử ngắn</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-secret-wax focus:ring-1 focus:ring-secret-wax/20"
                                        placeholder="Giới thiệu kinh nghiệm, chuyên môn..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
                                    Lưu giảng viên
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInstructors;
