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
import { Edit, Trash2, Plus, X, Briefcase, User, Info } from 'lucide-react';

import { db } from '../../firebase';
import RichTextEditor from '../../components/RichTextEditor';

const AdminRecruitment = () => {
    const [jobs, setJobs] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        targetCount: 1,
        hiredCount: 0,
        salary: '',
        deadline: '',
        isHot: false,
        description: '',
        isPublished: true,
    });

    // Categories matching the Frontend
    const CATEGORIES = [
        "KHỐI KINH DOANH – VẬN HÀNH",
        "KHỐI MARKETING",
        "KHỐI VĂN PHÒNG – HẬU CẦN",
        "KHỐI ĐÀO TẠO – SẢN PHẨM"
    ];

    const JOB_TYPES = [
        "Full-time",
        "Part-time",
        "Thực tập sinh (Intern)",
        "Cộng tác viên (CTV)",
        "Remote"
    ];

    // Fetch jobs from Firebase
    const fetchJobs = async () => {
        try {
            const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(jobsQuery);
            const jobsData = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data(),
            }));
            setJobs(jobsData);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            showToast('Không thể tải danh sách việc làm', 'error');
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
        }));
    };

    // Handle Rich Text Editor change
    const handleContentChange = (value) => {
        setFormData((prev) => ({ ...prev, description: value }));
    };

    // Open form for new job
    const handleAddNew = () => {
        setEditingJob(null);
        setFormData({
            title: '',
            category: CATEGORIES[0],
            jobType: 'Full-time',
            targetCount: 1,
            hiredCount: 0,
            salary: '',
            deadline: '',
            isHot: false,
            description: '',
            isPublished: true,
        });
        setIsFormOpen(true);
    };

    // Open form for editing job
    const handleEdit = (job) => {
        setEditingJob(job);
        setFormData({
            title: job.title || '',
            category: job.category || CATEGORIES[0],
            jobType: job.jobType || 'Full-time',
            targetCount: job.targetCount || 1,
            hiredCount: job.hiredCount || 0,
            salary: job.salary || '',
            deadline: job.deadline || '',
            isHot: job.isHot || false,
            description: job.description || '',
            isPublished: job.isPublished !== undefined ? job.isPublished : true,
        });
        setIsFormOpen(true);
    };

    // Submit form (add or update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const jobData = {
                ...formData,
                updatedAt: Date.now(),
            };

            if (editingJob) {
                await updateDoc(doc(db, 'jobs', editingJob.id), jobData);
                showToast('Cập nhật công việc thành công!');
            } else {
                await addDoc(collection(db, 'jobs'), {
                    ...jobData,
                    createdAt: Date.now(),
                });
                showToast('Tạo công việc mới thành công!');
            }
            setIsFormOpen(false);
            fetchJobs();
        } catch (error) {
            console.error('Error saving job:', error);
            showToast('Lỗi khi lưu công việc', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete job
    const handleDelete = async (jobId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa vị trí tuyển dụng này?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'jobs', jobId));
            setJobs((prev) => prev.filter((job) => job.id !== jobId));
            showToast('Xóa công việc thành công!');
        } catch (error) {
            console.error('Error deleting job:', error);
            showToast('Lỗi khi xóa công việc', 'error');
        }
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
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Tuyển Dụng</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Quản lý vị trí, số lượng và trạng thái tuyển dụng
                    </p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-2 rounded-lg bg-secret-wax px-4 py-2 text-sm font-semibold text-white transition hover:bg-secret-ink"
                >
                    <Plus className="h-4 w-4" />
                    Thêm vị trí mới
                </button>
            </div>

            {/* Jobs Table */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-200">
                            <tr>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Vị trí</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Phòng ban</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Mức lương</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Hạn nộp</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Chỉ tiêu</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Đã tuyển</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Còn lại</th>
                                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Trạng thái</th>
                                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {jobs.map((job) => {
                                const remaining = Math.max(0, (job.targetCount || 1) - (job.hiredCount || 0));
                                const isFull = remaining === 0;

                                return (
                                    <tr key={job.id} className="hover:bg-slate-50">
                                        <td className="py-4 font-medium text-slate-900">
                                            <div className="flex items-center gap-2">
                                                {job.isHot && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold">HOT</span>}
                                                {job.title}
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-slate-600">{job.category}</td>
                                        <td className="py-4 text-sm text-slate-600">{job.salary || '-'}</td>
                                        <td className="py-4 text-sm text-slate-600">{job.deadline || '-'}</td>
                                        <td className="py-4 text-sm font-medium text-slate-900">{job.targetCount}</td>
                                        <td className="py-4 text-sm font-medium text-green-600">{job.hiredCount}</td>
                                        <td className="py-4">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${isFull ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'}`}>
                                                {remaining}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${job.isPublished ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {job.isPublished ? 'Hiển thị' : 'Ẩn'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(job)}
                                                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                                    title="Sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(job.id)}
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
                            {jobs.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="py-12 text-center text-sm text-slate-500">
                                        Chưa có vị trí tuyển dụng nào.
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
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingJob ? 'Chỉnh sửa vị trí' : 'Thêm vị trí mới'}
                            </h2>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-6 md:col-span-2">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Tên vị trí <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-lg font-semibold focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            placeholder="VD: Chuyên viên Kinh doanh"
                                            required
                                        />
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Phòng ban / Khối <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            required
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Job Type */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Loại hình <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="jobType"
                                            value={formData.jobType}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            required
                                        >
                                            {JOB_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Salary */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Mức lương
                                        </label>
                                        <input
                                            type="text"
                                            name="salary"
                                            value={formData.salary}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            placeholder="VD: 15.000.000 - 20.000.000 VNĐ"
                                        />
                                    </div>

                                    {/* Deadline */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Hạn nộp hồ sơ
                                        </label>
                                        <input
                                            type="date"
                                            name="deadline"
                                            value={formData.deadline}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Target Count */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Số lượng cần tuyển <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="targetCount"
                                            min="1"
                                            value={formData.targetCount}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            required
                                        />
                                    </div>

                                    {/* Hired Count */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Đã tuyển được <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="hiredCount"
                                            min="0"
                                            value={formData.hiredCount}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                                        <input
                                            type="checkbox"
                                            name="isHot"
                                            id="isHot"
                                            checked={formData.isHot}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-red-500 rounded focus:ring-red-500 border-gray-300"
                                        />
                                        <label htmlFor="isHot" className="text-sm font-medium text-slate-700">
                                            Đánh dấu là Vị trí HOT (Hiển thị nổi bật)
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                                        <input
                                            type="checkbox"
                                            name="isPublished"
                                            id="isPublished"
                                            checked={formData.isPublished}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-secret-wax rounded focus:ring-secret-wax border-gray-300"
                                        />
                                        <label htmlFor="isPublished" className="text-sm font-medium text-slate-700">
                                            Hiển thị vị trí này trên trang tuyển dụng
                                        </label>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Mô tả công việc (JD)
                                    </label>
                                    <div className="rounded-lg border border-slate-200">
                                        <RichTextEditor
                                            value={formData.description}
                                            onChange={handleContentChange}
                                            placeholder="Nhập mô tả chi tiết, yêu cầu, quyền lợi..."
                                        />
                                    </div>
                                </div>
                            </div>

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
                                    className="rounded-lg bg-secret-wax px-6 py-2 text-sm font-semibold text-white hover:bg-secret-ink disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Đang lưu...' : editingJob ? 'Cập nhật' : 'Thêm vị trí'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRecruitment;
