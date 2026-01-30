import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

import { db } from "../../firebase";
import { deleteFromCloudinary, uploadToCloudinary } from "../../utils/uploadService";
import { getDoc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

const AdminBanners = () => {
  const [activeTab, setActiveTab] = useState("banners"); // 'banners' | 'content'
  const [banners, setBanners] = useState([]);
  const [formState, setFormState] = useState({
    title: "",
    subtitle: "",
    ctaText: "",
    ctaLink: "",
  });
  const [file, setFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Content Config State
  const [contentForm, setContentForm] = useState({
    successStoriesLabel: "CÂU CHUYỆN THỰC TẾ",
    successStoriesTitle: "NHỮNG BƯỚC NGOẶT THAY ĐỔI",
    successStoriesTitle: "NHỮNG BƯỚC NGOẶT THAY ĐỔI",
    successStoriesDesc: "Từ những bế tắc trong cuộc sống đến khi tìm thấy lối đi đúng đắn. Lắng nghe hành trình học viên đã áp dụng kiến thức để làm chủ tư duy và gặt hái thành công.",
    successStoriesDesc: "Từ những bế tắc trong cuộc sống đến khi tìm thấy lối đi đúng đắn. Lắng nghe hành trình học viên đã áp dụng kiến thức để làm chủ tư duy và gặt hái thành công.",
  });
  const [stories, setStories] = useState([]);
  const [isSavingContent, setIsSavingContent] = useState(false);

  const fetchBanners = async () => {
    try {
      const snapshot = await getDocs(collection(db, "banners"));
      const items = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setBanners(items);
    } catch (err) {
      console.error("Error fetching banners:", err);
    }
  };

  const fetchContent = async () => {
    try {
      const docRef = doc(db, "homepage_content", "success_stories");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setContentForm({
          successStoriesLabel: data.label || "CÂU CHUYỆN THỰC TẾ",
          successStoriesTitle: data.title || "NHỮNG BƯỚC NGOẶT THAY ĐỔI",
          successStoriesTitle: data.title || "NHỮNG BƯỚC NGOẶT THAY ĐỔI",
          successStoriesDesc: data.description || "Từ những bế tắc trong cuộc sống đến khi tìm thấy lối đi đúng đắn. Lắng nghe hành trình học viên đã áp dụng kiến thức để làm chủ tư duy và gặt hái thành công.",
          successStoriesDesc: data.description || "Từ những bế tắc trong cuộc sống đến khi tìm thấy lối đi đúng đắn. Lắng nghe hành trình học viên đã áp dụng kiến thức để làm chủ tư duy và gặt hái thành công.",
        });
        setStories((data.stories || []).map(s => ({ ...s, _expanded: false })));
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchContent();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    const { name } = event.target;
    if (name === "mobileImage") {
      setMobileFile(selectedFile || null);
    } else {
      setFile(selectedFile || null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Vui long chon anh banner.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Ho tro anh JPG/JPEG/PNG. Vui long chon dung dinh dang.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadResult = await uploadToCloudinary(file);
      let mobileUploadResult = null;
      if (mobileFile) {
        mobileUploadResult = await uploadToCloudinary(mobileFile);
      }

      await addDoc(collection(db, "banners"), {
        title: formState.title,
        subtitle: formState.subtitle,
        ctaText: formState.ctaText,
        ctaLink: formState.ctaLink,
        imageUrl: uploadResult.secureUrl,
        mobileImageUrl: mobileUploadResult ? mobileUploadResult.secureUrl : null,
        deleteToken: uploadResult.deleteToken || null,
        mobileDeleteToken: mobileUploadResult ? mobileUploadResult.deleteToken : null,
        publicId: uploadResult.publicId || null,
        active: true,
        createdAt: Date.now(),
      });
      setFormState({
        title: "",
        subtitle: "",
        ctaText: "",
        ctaLink: "",
      });
      setFile(null);
      setMobileFile(null);
      await fetchBanners();
    } catch (err) {
      console.error("Them banner loi:", err);
      setError(
        err?.message ||
        "Khong the them banner. Vui long thu lai hoac kiem tra lai cau hinh Cloudinary."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (bannerId, deleteToken) => {
    await deleteDoc(doc(db, "banners", bannerId));
    if (deleteToken) {
      await deleteFromCloudinary(deleteToken);
    }
    // Delete mobile banner if exists (assuming we can get it from the banner object passed/found, 
    // but here we only passed ID and token. To be safe, we should fetch or pass the whole object.
    // simpler: update the UI to just hide it, but correct way is to cleanup.
    // For now, let's just ensure we clean up the main one. 
    // To do it right, we'd need to change the function signature or lookup.
    // Let's lookup the banner from state to find the mobile token.
    const bannerToDelete = banners.find(b => b.id === bannerId);
    if (bannerToDelete?.mobileDeleteToken) {
      await deleteFromCloudinary(bannerToDelete.mobileDeleteToken);
    }
    setBanners((prev) => prev.filter((banner) => banner.id !== bannerId));
  };

  const handleToggleActive = async (bannerId, currentValue) => {
    await updateDoc(doc(db, "banners", bannerId), { active: !currentValue });
    setBanners((prev) =>
      prev.map((banner) =>
        banner.id === bannerId
          ? { ...banner, active: !currentValue }
          : banner
      )
    );
  };

  const handleContentChange = (e) => {
    const { name, value } = e.target;
    setContentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveContent = async (e) => {
    e.preventDefault();
    setIsSavingContent(true);
    try {
      await setDoc(doc(db, "homepage_content", "success_stories"), {
        label: contentForm.successStoriesLabel,
        title: contentForm.successStoriesTitle,
        description: contentForm.successStoriesDesc,
        description: contentForm.successStoriesDesc,
        stories: stories.map(({ _expanded, ...rest }) => rest),
        updatedAt: Date.now()
      });
      toast.success("Cập nhật nội dung thành công!");
    } catch (err) {
      console.error("Error saving content:", err);
      toast.error("Lỗi khi lưu nội dung.");
    } finally {
      setIsSavingContent(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Trang Chủ</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("banners")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "banners"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
          >
            Banner Slide
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "content"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
          >
            Cảm nhận học viên
          </button>
        </nav>
      </div>

      {activeTab === "banners" ? (
        <div className="space-y-8">
          {/* Banner Form Section */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-xl font-semibold text-slate-900">
                Thêm banner mới
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Tải ảnh banner và nhập thông tin hiển thị.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="title">
                    Tiêu đề
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formState.title}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Nhập tiêu đề banner"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="subtitle">
                    Mô tả
                  </label>
                  <input
                    id="subtitle"
                    name="subtitle"
                    type="text"
                    value={formState.subtitle}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Mô tả ngắn"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="ctaText">
                    Text nút
                  </label>
                  <input
                    id="ctaText"
                    name="ctaText"
                    type="text"
                    value={formState.ctaText}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Ví dụ: Đăng ký ngay"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="ctaLink">
                    Link nút
                  </label>
                  <input
                    id="ctaLink"
                    name="ctaLink"
                    type="text"
                    value={formState.ctaLink}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="/dao-tao"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="image">
                  Ảnh banner Desktop (1920x1080)
                </label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="mobileImage">
                  Ảnh banner Mobile (800x1000)
                </label>
                <input
                  id="mobileImage"
                  name="mobileImage"
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Đang xử lý..." : "Thêm Banner"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Danh sách banner
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Bật/tắt hiển thị và quản lý banner.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="rounded-xl border border-slate-100 p-4 shadow-sm"
                >
                  <div className="h-32 overflow-hidden rounded-lg bg-slate-100">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {banner.title}
                      </h3>
                      <p className="text-xs text-slate-500">{banner.subtitle}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(banner.id, banner.active)}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${banner.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-500"
                          }`}
                      >
                        {banner.active ? "Đang bật" : "Đang tắt"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(banner.id, banner.deleteToken)}
                        className="inline-flex items-center justify-center rounded-full p-2 text-red-500 hover:bg-red-50"
                        aria-label="Xoa banner"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {banners.length === 0 && (
                <div className="col-span-full text-center text-sm text-slate-500">
                  Chưa có banner nào. Hãy thêm banner mới.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Content Config Section */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Nội dung: Cảm nhận học viên
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Chỉnh sửa tiêu đề và mô tả cho phần "Những bước ngoặt thay đổi" trên trang chủ.
              </p>
            </div>

            <form onSubmit={handleSaveContent} className="mt-6 space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nhãn (Label nhỏ phía trên)
                  </label>
                  <input
                    type="text"
                    name="successStoriesLabel"
                    value={contentForm.successStoriesLabel}
                    onChange={handleContentChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                    placeholder="VD: CÂU CHUYỆN THỰC TẾ"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Tiêu đề chính (H2)
                  </label>
                  <input
                    type="text"
                    name="successStoriesTitle"
                    value={contentForm.successStoriesTitle}
                    onChange={handleContentChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-lg font-bold focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                    placeholder="VD: NHỮNG BƯỚC NGOẶT THAY ĐỔI"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Mô tả ngắn
                  </label>
                  <textarea
                    name="successStoriesDesc"
                    value={contentForm.successStoriesDesc}
                    onChange={handleContentChange}
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-secret-wax focus:outline-none focus:ring-2 focus:ring-secret-wax/20"
                    placeholder="Nhập mô tả..."
                  />
                </div>
              </div>


              {/* Stories List Editor */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-slate-700">
                    Danh sách Video (Cards)
                  </label>
                  <button
                    type="button"
                    onClick={() => setStories([...stories, { id: Date.now(), name: "", role: "", programTag: "Luật Hấp Dẫn", headline: "", quote: "", videoUrl: "", statsLabel: "", _expanded: true }])}
                    className="text-xs font-semibold text-secret-wax hover:text-secret-ink"
                  >
                    + Thêm Card
                  </button>
                </div>

                <div className="space-y-4">
                  {stories.map((story, index) => (
                    <div key={story.id || index} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                      <div
                        className="flex items-center justify-between p-3 bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
                        onClick={() => {
                          const newStories = [...stories];
                          newStories[index]._expanded = !newStories[index]._expanded;
                          setStories(newStories);
                        }}
                      >
                        <div className="flex items-center gap-2 font-medium text-slate-700 text-sm">
                          {story._expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span>{story.name || "Thành viên mới"}</span>
                          {story.headline && <span className="text-slate-500 font-normal"> - {story.headline}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStories(stories.filter((_, i) => i !== index));
                          }}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {story._expanded && (
                        <div className="p-4 border-t border-slate-200">
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              placeholder="Họ tên"
                              value={story.name}
                              onChange={(e) => {
                                const newStories = [...stories];
                                newStories[index].name = e.target.value;
                                setStories(newStories);
                              }}
                              className="w-full rounded border-slate-200 text-sm px-3 py-1.5"
                            />
                            <input
                              placeholder="Chức vụ / Nghề nghiệp"
                              value={story.role}
                              onChange={(e) => {
                                const newStories = [...stories];
                                newStories[index].role = e.target.value;
                                setStories(newStories);
                              }}
                              className="w-full rounded border-slate-200 text-sm px-3 py-1.5"
                            />
                            <select
                              value={story.programTag}
                              onChange={(e) => {
                                const newStories = [...stories];
                                newStories[index].programTag = e.target.value;
                                setStories(newStories);
                              }}
                              className="w-full rounded border-slate-200 text-sm px-3 py-1.5"
                            >
                              <option value="Luật Hấp Dẫn">Luật Hấp Dẫn</option>
                              <option value="Khơi Thông Dòng Tiền">Khơi Thông Dòng Tiền</option>
                              <option value="Vút Tốc Mục Tiêu">Vút Tốc Mục Tiêu</option>
                              <option value="Khác">Khác</option>
                            </select>
                            <input
                              placeholder="Tiêu đề (VD: X2 thu nhập)"
                              value={story.headline}
                              onChange={(e) => {
                                const newStories = [...stories];
                                newStories[index].headline = e.target.value;
                                setStories(newStories);
                              }}
                              className="w-full rounded border-slate-200 text-sm px-3 py-1.5"
                            />
                            <input
                              placeholder="Link Video Youtube"
                              value={story.videoUrl}
                              onChange={(e) => {
                                const newStories = [...stories];
                                newStories[index].videoUrl = e.target.value;
                                setStories(newStories);
                              }}
                              className="w-full rounded border-slate-200 text-sm px-3 py-1.5"
                            />
                            <input
                              placeholder="Label Chỉ số (VD: +100% Sales)"
                              value={story.statsLabel}
                              onChange={(e) => {
                                const newStories = [...stories];
                                newStories[index].statsLabel = e.target.value;
                                setStories(newStories);
                              }}
                              className="w-full rounded border-slate-200 text-sm px-3 py-1.5"
                            />
                            <textarea
                              placeholder="Câu trích dẫn (Quote)..."
                              value={story.quote}
                              onChange={(e) => {
                                const newStories = [...stories];
                                newStories[index].quote = e.target.value;
                                setStories(newStories);
                              }}
                              className="w-full rounded border-slate-200 text-sm px-3 py-1.5 md:col-span-2"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {stories.length === 0 && (
                    <p className="text-center text-sm text-slate-500 italic py-4">Chưa có video nào. Nhấn "+ Thêm Card" để tạo.</p>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSavingContent}
                  className="inline-flex items-center justify-center rounded-lg bg-secret-wax px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-secret-ink disabled:opacity-70"
                >
                  {isSavingContent ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
export default AdminBanners;
