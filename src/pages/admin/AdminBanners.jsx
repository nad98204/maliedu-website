import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { Trash2, ChevronDown, ChevronUp, Pencil, X } from "lucide-react";

import { crmFirestore, db } from "../../firebase";
import { writeHomeBannerCache } from "../../utils/homeBannerCache";
import { deleteFromCloudinary } from "../../utils/uploadService";
import { uploadFileToS3 } from "../../utils/s3UploadService";
import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { HERO_SLIDES } from "../../data/heroData";

const BANNER_POSITIONS = [
  { value: "home_hero", label: "Banner Slide Trang chủ" },
  { value: "news_sidebar", label: "Sidebar Tin tức" },
];

const DEFAULT_LANDING_OPTIONS = [
  { title: "Khơi Thông Dòng Tiền", path: "/dao-tao/khoi-thong-dong-tien" },
  { title: "Luật Hấp Dẫn", path: "/dao-tao/luat-hap-dan" },
  { title: "Chinh Phục Mục Tiêu", path: "/dao-tao/chinh-phuc-muc-tieu" },
];

const normalizeLandingPath = (value) => {
  const path = String(value || "").trim();
  if (!path || /^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

const mergeLandingOptions = (dynamicOptions = []) => {
  const optionsByPath = new Map(
    DEFAULT_LANDING_OPTIONS.map((option) => [option.path, option]),
  );

  dynamicOptions.forEach((option) => {
    const path = normalizeLandingPath(option.path);
    if (!path || optionsByPath.has(path)) return;
    optionsByPath.set(path, {
      title: option.title || path,
      path,
    });
  });

  return Array.from(optionsByPath.values());
};

const createEmptyBannerForm = () => ({
  title: "",
  subtitle: "",
  ctaText: "",
  ctaLink: "",
  imageUrl: "",
  mobileImageUrl: "",
  position: "home_hero",
});

const getBannerPosition = (banner) => banner.position || "home_hero";

const AdminBanners = () => {
  const [activeTab, setActiveTab] = useState("banners"); // 'banners' | 'content'
  const [previewDevice, setPreviewDevice] = useState("desktop"); // 'desktop' | 'mobile'
  const [banners, setBanners] = useState([]);
  const [formState, setFormState] = useState(createEmptyBannerForm);
  const [file, setFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [positionFilter, setPositionFilter] = useState("all");
  const [landingOptions, setLandingOptions] = useState(DEFAULT_LANDING_OPTIONS);
  const [enabledSidebarLandingPaths, setEnabledSidebarLandingPaths] = useState([]);
  const [hasSidebarLandingConfig, setHasSidebarLandingConfig] = useState(false);
  const [isSidebarConfigLoading, setIsSidebarConfigLoading] = useState(true);
  const [isSavingSidebarConfig, setIsSavingSidebarConfig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Content Config State
  const [contentForm, setContentForm] = useState({
    successStoriesLabel: "CÂU CHUYỆN THỰC TẾ",
    successStoriesTitle: "NHỮNG BƯỚC NGOẶT THAY ĐỔI",
    successStoriesDesc: "Từ những bế tắc trong cuộc sống đến khi tìm thấy lối đi đúng đắn. Lắng nghe hành trình học viên đã áp dụng kiến thức để làm chủ tư duy và gặt hái thành công.",
  });
  const [stories, setStories] = useState([]);
  const [isSavingContent, setIsSavingContent] = useState(false);

  const fetchBanners = useCallback(async () => {
    try {
      console.log("Starting fetch banners from:", db);
      const snapshot = await getDocs(collection(db, "banners"));
      console.log("Snapshot size:", snapshot.size);
      
      if (snapshot.empty) {
        toast("Không tìm thấy banner nào trong Database (Collection 'banners' trống)", { icon: "⚠️" });
      }

      const items = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setBanners(items);
      writeHomeBannerCache(items);
    } catch (err) {
      console.error("Error fetching banners:", err);
      toast.error(`Lỗi tải dữ liệu: ${err.message}`);
    }
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      const docRef = doc(db, "homepage_content", "success_stories");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setContentForm({
          successStoriesLabel: data.label || "CÂU CHUYỆN THỰC TẾ",
          successStoriesTitle: data.title || "NHỮNG BƯỚC NGOẶT THAY ĐỔI",
          successStoriesDesc: data.description || "Từ những bế tắc trong cuộc sống đến khi tìm thấy lối đi đúng đắn. Lắng nghe hành trình học viên đã áp dụng kiến thức để làm chủ tư duy và gặt hái thành công.",
        });
        setStories((data.stories || []).map(s => ({ ...s, _expanded: false })));
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    }
  }, []);

  const fetchLandingOptions = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(crmFirestore, "landing_pages"));
      const dynamicOptions = snapshot.docs.map((landingDoc) => {
        const data = landingDoc.data();
        return {
          title: data.name || data.title || landingDoc.id,
          path: data.slug || data.path || data.url || "",
        };
      });
      setLandingOptions(mergeLandingOptions(dynamicOptions));
    } catch (err) {
      console.warn("Không thể tải danh sách landing_pages, sử dụng danh sách mặc định:", err);
      setLandingOptions(DEFAULT_LANDING_OPTIONS);
    }
  }, []);

  const fetchSidebarLandingConfig = useCallback(async () => {
    try {
      const configSnapshot = await getDoc(
        doc(crmFirestore, "public_settings", "sidebar_landing_config"),
      );
      const enabledPaths = configSnapshot.exists()
        ? configSnapshot.data()?.enabledPaths
        : null;

      setHasSidebarLandingConfig(configSnapshot.exists());
      setEnabledSidebarLandingPaths(
        Array.isArray(enabledPaths)
          ? [...new Set(enabledPaths.map(normalizeLandingPath).filter(Boolean))]
          : DEFAULT_LANDING_OPTIONS.map((option) => option.path),
      );
    } catch (err) {
      console.error("Không thể tải cấu hình Sidebar Landing Banners:", err);
      setEnabledSidebarLandingPaths(DEFAULT_LANDING_OPTIONS.map((option) => option.path));
      setHasSidebarLandingConfig(false);
    } finally {
      setIsSidebarConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
    fetchContent();
    fetchLandingOptions();
    fetchSidebarLandingConfig();
  }, [fetchBanners, fetchContent, fetchLandingOptions, fetchSidebarLandingConfig]);

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

  const handleLandingSelect = (event) => {
    const selectedPath = event.target.value;
    const selectedLanding = landingOptions.find((option) => option.path === selectedPath);
    if (!selectedLanding) return;

    setFormState((prev) => ({
      ...prev,
      ctaLink: selectedLanding.path,
      title: selectedLanding.title,
    }));
  };

  const handleToggleSidebarLanding = (path) => {
    setEnabledSidebarLandingPaths((currentPaths) => (
      currentPaths.includes(path)
        ? currentPaths.filter((currentPath) => currentPath !== path)
        : [...currentPaths, path]
    ));
  };

  const handleSaveSidebarLandingConfig = async () => {
    setIsSavingSidebarConfig(true);
    try {
      const enabledPaths = [...new Set(
        enabledSidebarLandingPaths.map(normalizeLandingPath).filter(Boolean),
      )];
      await setDoc(
        doc(crmFirestore, "public_settings", "sidebar_landing_config"),
        {
          enabledPaths,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setEnabledSidebarLandingPaths(enabledPaths);
      setHasSidebarLandingConfig(true);
      toast.success("Đã lưu cấu hình Sidebar Landing Banners!");
    } catch (err) {
      console.error("Không thể lưu cấu hình Sidebar Landing Banners:", err);
      toast.error("Không thể lưu cấu hình Sidebar Landing Banners.");
    } finally {
      setIsSavingSidebarConfig(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const hasDesktop = file || formState.imageUrl;
    const hasMobile = mobileFile || formState.mobileImageUrl;

    if (!hasDesktop && !hasMobile) {
      setError("Vui lòng chọn ảnh hoặc nhập Link ảnh (Desktop hoặc Mobile).");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png"];
    if (file && !allowedTypes.includes(file.type)) {
      setError("Ảnh Desktop: Hỗ trợ ảnh JPG/JPEG/PNG. Vui lòng chọn đúng định dạng.");
      return;
    }
    if (mobileFile && !allowedTypes.includes(mobileFile.type)) {
      setError("Ảnh Mobile: Hỗ trợ ảnh JPG/JPEG/PNG. Vui lòng chọn đúng định dạng.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadFolder = formState.position === "news_sidebar"
        ? "banners/news-sidebar"
        : "banners/home-hero";
      let finalImageUrl = formState.imageUrl;
      if (file) finalImageUrl = await uploadFileToS3(file, undefined, { folder: uploadFolder });
      
      let finalMobileImageUrl = formState.mobileImageUrl;
      if (mobileFile) finalMobileImageUrl = await uploadFileToS3(mobileFile, undefined, { folder: uploadFolder });

      const bannerPayload = {
        title: formState.title,
        subtitle: formState.subtitle,
        ctaText: formState.ctaText,
        ctaLink: formState.ctaLink,
        position: formState.position,
        imageUrl: finalImageUrl,
        mobileImageUrl: finalMobileImageUrl,
        updatedAt: Date.now(),
      };

      if (editingBannerId) {
        await updateDoc(doc(db, "banners", editingBannerId), bannerPayload);
        toast.success("Cập nhật banner thành công!");
      } else {
        await addDoc(collection(db, "banners"), {
          ...bannerPayload,
          imageWidth: null,
          imageHeight: null,
          mobileImageWidth: null,
          mobileImageHeight: null,
          deleteToken: null,
          mobileDeleteToken: null,
          publicId: null,
          active: true,
          createdAt: Date.now(),
        });
        toast.success("Thêm banner thành công!");
      }

      setFormState(createEmptyBannerForm());
      setFile(null);
      setMobileFile(null);
      setEditingBannerId(null);
      
      // Clear file inputs manually
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => { input.value = ''; });

      await fetchBanners();
    } catch (err) {
      console.error("Them banner loi:", err);
      setError(
        err?.message ||
        "Không thể lưu banner. Vui lòng thử lại hoặc kiểm tra cấu hình S3."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingBannerId(banner.id);
    setFormState({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      ctaText: banner.ctaText || "",
      ctaLink: banner.ctaLink || "",
      imageUrl: banner.imageUrl || "",
      mobileImageUrl: banner.mobileImageUrl || "",
      position: getBannerPosition(banner),
    });
    setFile(null);
    setMobileFile(null);
    setError("");
    document.getElementById("banner-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelEdit = () => {
    setEditingBannerId(null);
    setFormState(createEmptyBannerForm());
    setFile(null);
    setMobileFile(null);
    setError("");
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
    setBanners((prev) => {
      const nextBanners = prev.filter((banner) => banner.id !== bannerId);
      writeHomeBannerCache(nextBanners);
      return nextBanners;
    });
  };

  const handleToggleActive = async (bannerId, currentValue) => {
    await updateDoc(doc(db, "banners", bannerId), { active: !currentValue });
    setBanners((prev) => {
      const nextBanners = prev.map((banner) =>
        banner.id === bannerId
          ? { ...banner, active: !currentValue }
          : banner
      );
      writeHomeBannerCache(nextBanners);
      return nextBanners;
    });
  };

  const handleImportSamples = async (skipConfirm = false) => {
    if (!skipConfirm && !window.confirm("Bạn có muốn nhập dữ liệu mẫu từ các banner slide cũ không?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      // First, check if we want to migrate them to S3 immediately
      // But since we are in the browser, downloading and uploading 3 files is fast.
      const bannersToImport = await Promise.all(HERO_SLIDES.map(async (slide) => {
        let imageUrl = slide.image;
        let mobileImageUrl = slide.mobileImage;

        // Try to migrate to S3 if possible
        try {
          const downloadAndUpload = async (url, name) => {
            if (!url) return null;
            const res = await fetch(url);
            const blob = await res.blob();
            const file = new File([blob], name, { type: blob.type });
            return await uploadFileToS3(file);
          };

          const s3Url = await downloadAndUpload(slide.image, `banner-${slide.id}.jpg`);
          if (s3Url) imageUrl = s3Url;

          const s3MobileUrl = await downloadAndUpload(slide.mobileImage, `banner-mobile-${slide.id}.jpg`);
          if (s3MobileUrl) mobileImageUrl = s3MobileUrl;
        } catch (s3Err) {
          console.error("Migration to S3 failed for slide:", slide.id, s3Err);
          // fall back to cloudinary URL
        }

        return {
          title: slide.title,
          subtitle: slide.subtitle,
          ctaText: slide.ctaText,
          ctaLink: slide.ctaLink,
          imageUrl,
          mobileImageUrl,
          position: "home_hero",
          active: true,
          createdAt: Date.now(),
        };
      }));

      const promises = bannersToImport.map(data => addDoc(collection(db, "banners"), data));
      await Promise.all(promises);
      toast.success("Nhập mẫu và chuyển sang S3 thành công!");
      await fetchBanners();
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Lỗi khi nhập mẫu.");
    } finally {
      setIsSubmitting(false);
    }
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
        stories: stories.map((s) => {
          const rest = { ...s };
          delete rest._expanded;
          return rest;
        }),
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

  const displayedBanners = banners.filter((banner) => {
    const bannerPosition = getBannerPosition(banner);
    const matchesPosition = positionFilter === "all" || bannerPosition === positionFilter;
    const hasPreviewImage = bannerPosition === "news_sidebar"
      ? Boolean(banner.imageUrl || banner.mobileImageUrl)
      : previewDevice === "desktop"
        ? Boolean(banner.imageUrl)
        : Boolean(banner.mobileImageUrl);

    return matchesPosition && hasPreviewImage;
  });

  const getBannerPreviewImage = (banner) => {
    if (getBannerPosition(banner) === "news_sidebar") {
      return banner.imageUrl || banner.mobileImageUrl || "";
    }
    return previewDevice === "desktop" ? banner.imageUrl : banner.mobileImageUrl;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Banner & Nội dung</h1>
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
            Quản lý Banner
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
          <section id="banner-editor" className="scroll-mt-24 rounded-2xl bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-xl font-semibold text-slate-900">
                {editingBannerId ? "Chỉnh sửa banner" : "Thêm banner mới"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Chọn đúng vị trí, tải ảnh lên S3 và nhập thông tin hiển thị.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="position">
                  Vị trí banner
                </label>
                <select
                  id="position"
                  name="position"
                  value={formState.position}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {BANNER_POSITIONS.map((position) => (
                    <option key={position.value} value={position.value}>{position.label}</option>
                  ))}
                </select>
                {formState.position === "news_sidebar" && (
                  <p className="text-xs text-slate-500">Khuyến nghị ảnh dọc tỷ lệ 4:5. Ảnh được lưu trong thư mục S3 banners/news-sidebar.</p>
                )}
              </div>

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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="ctaLink">
                    Link nút
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select
                      value={landingOptions.some((option) => option.path === formState.ctaLink) ? formState.ctaLink : ""}
                      onChange={handleLandingSelect}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      aria-label="Chọn nhanh Landing Page"
                    >
                      <option value="">Chọn nhanh Landing Page</option>
                      {landingOptions.map((option) => (
                        <option key={option.path} value={option.path}>
                          {option.title} ({option.path})
                        </option>
                      ))}
                    </select>
                    <input
                      id="ctaLink"
                      name="ctaLink"
                      type="text"
                      value={formState.ctaLink}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="/dao-tao hoặc URL tùy chỉnh"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Chọn một landing để tự điền tiêu đề và đường dẫn, hoặc nhập link thủ công.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="image">
                    Ảnh Desktop (Tải lên hoặc dán Link)
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500"
                    />
                    <input
                      name="imageUrl"
                      type="text"
                      value={formState.imageUrl}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Hoặc dán link ảnh Desktop (https://...)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="mobileImage">
                    Ảnh Mobile (Tải lên hoặc dán Link)
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      id="mobileImage"
                      name="mobileImage"
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500"
                    />
                    <input
                      name="mobileImageUrl"
                      type="text"
                      value={formState.mobileImageUrl}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Hoặc dán link ảnh Mobile (https://...)"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting
                    ? "Đang xử lý..."
                    : editingBannerId
                      ? "Lưu thay đổi"
                      : "Thêm Banner"}
                </button>
                {editingBannerId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Cài đặt Sidebar Landing Banners
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Chỉ các Landing Page được bật tại đây mới được phép xuất hiện ngẫu nhiên trong Sidebar Tin tức.
              </p>
              {!isSidebarConfigLoading && !hasSidebarLandingConfig && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Chưa có cấu hình Firestore. Hãy kiểm tra lựa chọn bên dưới và bấm “Lưu cài đặt” để áp dụng.
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {landingOptions.map((landing) => {
                const isEnabled = enabledSidebarLandingPaths.includes(landing.path);
                return (
                  <div
                    key={landing.path}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{landing.title}</h3>
                      <p className="mt-1 truncate text-xs text-slate-500" title={landing.path}>{landing.path}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`${isEnabled ? "Tắt" : "Bật"} ${landing.title}`}
                      disabled={isSidebarConfigLoading}
                      onClick={() => handleToggleSidebarLanding(landing.path)}
                      className={`relative h-7 w-12 flex-none rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        isEnabled ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          isEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveSidebarLandingConfig}
                disabled={isSidebarConfigLoading || isSavingSidebarConfig}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingSidebarConfig ? "Đang lưu..." : "Lưu cài đặt"}
              </button>
              <span className="text-xs text-slate-500">
                Đã bật {enabledSidebarLandingPaths.length}/{landingOptions.length} Landing Page
              </span>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Danh sách banner
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bật/tắt hiển thị và xem trước banner.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={positionFilter}
                  onChange={(event) => setPositionFilter(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  aria-label="Lọc banner theo vị trí"
                >
                  <option value="all">Tất cả vị trí</option>
                  {BANNER_POSITIONS.map((position) => (
                    <option key={position.value} value={position.value}>{position.label}</option>
                  ))}
                </select>
                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      previewDevice === "desktop"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Desktop Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      previewDevice === "mobile"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Mobile Preview
                  </button>
                </div>
              </div>
            </div>

            <div className={`mt-6 grid gap-6 ${
              previewDevice === "desktop" 
                ? "grid-cols-1 md:grid-cols-2" 
                : "grid-cols-2 lg:grid-cols-4"
            }`}>
              {displayedBanners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex flex-col rounded-xl border border-slate-100 p-4 shadow-sm bg-white"
                >
                  <div className={`relative w-full overflow-hidden rounded-md bg-slate-100 flex items-center justify-center ${
                    getBannerPosition(banner) === "news_sidebar" || previewDevice === "mobile"
                      ? "aspect-[4/5]"
                      : "aspect-video"
                  }`}>
                    <img
                      src={getBannerPreviewImage(banner)}
                      alt={banner.title}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <div className="mt-4 space-y-3 flex-1 flex flex-col justify-end">
                    <div>
                      <span className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        getBannerPosition(banner) === "news_sidebar"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {getBannerPosition(banner) === "news_sidebar" ? "Sidebar Tin tức" : "Slide Trang chủ"}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {banner.title}
                      </h3>
                      <p className="text-xs text-slate-500">{banner.subtitle}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
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
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(banner)}
                          className="inline-flex items-center justify-center rounded-full p-2 text-blue-600 hover:bg-blue-50"
                          aria-label={`Sửa banner ${banner.title || ""}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(banner.id, banner.deleteToken)}
                          className="inline-flex items-center justify-center rounded-full p-2 text-red-500 hover:bg-red-50"
                          aria-label={`Xóa banner ${banner.title || ""}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {displayedBanners.length === 0 && (
                <div className="col-span-full py-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <p className="text-sm text-slate-500 mb-4">
                    {banners.length === 0
                      ? "Chưa có banner nào. Hãy thêm banner mới hoặc khởi tạo dữ liệu mẫu."
                      : "Không có banner phù hợp với bộ lọc và chế độ xem hiện tại."}
                  </p>
                  {banners.length === 0 && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleImportSamples}
                      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isSubmitting ? "Đang xử lý..." : "Nhập ảnh banner slide mẫu"}
                    </button>
                  )}
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
