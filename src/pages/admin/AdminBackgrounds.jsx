import { useEffect, useState } from "react";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
} from "firebase/firestore";
import { Trash2, Image as ImageIcon, Upload } from "lucide-react";

import { db } from "../../firebase";
import { deleteFromCloudinary, uploadToCloudinary } from "../../utils/uploadService";

const AdminBackgrounds = () => {
    const [images, setImages] = useState([]);
    const [file, setFile] = useState(null);
    const [category, setCategory] = useState("default");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const CATEGORIES = [
        { value: "default", label: "Mặc định (Hiện tất cả trang)" },
        { value: "vut-toc-muc-tieu", label: "Vút Tốc Mục Tiêu" },
        { value: "luat-hap-dan", label: "Luật Hấp Dẫn" },
    ];

    const fetchImages = async () => {
        try {
            const q = query(collection(db, "hero_images"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data(),
            }));
            setImages(items);
        } catch (err) {
            console.error("Lỗi khi tải ảnh:", err);
            setError("Không thể tải danh sách ảnh.");
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith("image/")) {
                setError("Vui lòng chọn file ảnh hợp lệ.");
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError("");
        }
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        setError("");

        if (!file) {
            setError("Vui lòng chọn ảnh để tải lên.");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Upload to Cloudinary
            const uploadResult = await uploadToCloudinary(file);

            // 2. Save metadata to Firestore
            await addDoc(collection(db, "hero_images"), {
                imageUrl: uploadResult.secureUrl,
                category: category,
                deleteToken: uploadResult.deleteToken || null,
                publicId: uploadResult.publicId || null,
                createdAt: Date.now(),
            });

            // 3. Reset form and refresh list
            setFile(null);
            // Reset file input value manually if needed, strict React way involves a ref but this is fine for now
            const fileInput = document.getElementById("file-upload");
            if (fileInput) fileInput.value = "";

            await fetchImages();
        } catch (err) {
            console.error("Lỗi upload:", err);
            setError("Không thể tải ảnh lên. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (imageId, deleteToken) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;

        try {
            // 1. Delete from Firestore
            await deleteDoc(doc(db, "hero_images", imageId));

            // 2. Delete from Cloudinary (if token exists)
            if (deleteToken) {
                await deleteFromCloudinary(deleteToken);
            }

            // 3. Update UI
            setImages((prev) => prev.filter((img) => img.id !== imageId));
        } catch (err) {
            console.error("Lỗi xóa ảnh:", err);
            setError("Không thể xóa ảnh. Vui lòng thử lại.");
        }
    };

    const getCategoryLabel = (catValue) => {
        return CATEGORIES.find(c => c.value === catValue)?.label || catValue;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <ImageIcon className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">
                            Quản lý Ảnh Nền / Slide
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Tải lên và quản lý các ảnh hiển thị ở phần Hero của trang Cảm nhận.
                        </p>
                    </div>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleUpload} className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Ảnh Mới
                    </h3>

                    <div className="grid gap-6 md:grid-cols-[1fr,1fr,auto] items-end">
                        {/* File Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Chọn Ảnh</label>
                            <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Chọn trang áp dụng</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !file}
                            className="px-6 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-[42px]"
                        >
                            {isSubmitting ? "Đang tải..." : "Tải lên ngay"}
                        </button>
                    </div>
                    {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
                </form>
            </section>

            {/* Gallery */}
            <section className="space-y-6">
                {/* Group by category or just list normally? The requirement asked for a grid. Let's do a grouped view or simple grid with badges. */}
                {/* Simple grid with badges is flexible. */}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map((img) => (
                        <div key={img.id} className="group relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                            {/* Image */}
                            <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                                <img
                                    src={img.imageUrl}
                                    alt="Hero Background"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${img.category === 'default'
                                        ? 'bg-gray-100 text-gray-700 border-gray-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                    }`}>
                                    {getCategoryLabel(img.category)}
                                </span>
                                <div className="mt-2 text-xs text-slate-400">
                                    {new Date(img.createdAt).toLocaleDateString('vi-VN')}
                                </div>
                            </div>

                            {/* Delete Action */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(img.id, img.deleteToken)}
                                    className="p-2 bg-white/90 text-red-600 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                                    title="Xóa ảnh"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {images.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-slate-900 font-medium">Chưa có ảnh nào</h3>
                        <p className="text-slate-500 text-sm mt-1">Hãy tải lên ảnh đầu tiên cho slide hero.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminBackgrounds;
