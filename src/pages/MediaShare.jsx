import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Download, Home, Image as ImageIcon, LoaderCircle, PlayCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import SEO from "../components/SEO";
import { MALI_LOGO_URL } from "../constants/brandAssets";

const MediaShare = () => {
  const { fileId } = useParams();
  const [media, setMedia] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    const loadMedia = async () => {
      setStatus("loading");

      try {
        const response = await fetch(`/api/storage-share?id=${encodeURIComponent(fileId || "")}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Media is unavailable");
        }

        const payload = await response.json();
        setMedia(payload);
        setStatus("ready");
      } catch (error) {
        if (error.name !== "AbortError") {
          setMedia(null);
          setStatus("error");
        }
      }
    };

    loadMedia();
    return () => controller.abort();
  }, [fileId]);

  if (status === "loading") {
    return (
      <section className="flex min-h-[55vh] items-center justify-center bg-gradient-to-b from-secret-paper/40 to-white px-4">
        <SEO title="Đang tải nội dung" />
        <div className="text-center text-slate-600">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-secret-wax" />
          <p className="mt-4 font-medium">Đang tải nội dung Mali Edu...</p>
        </div>
      </section>
    );
  }

  if (status === "error" || !media) {
    return (
      <section className="flex min-h-[55vh] items-center justify-center bg-gradient-to-b from-secret-paper/40 to-white px-4 py-16">
        <SEO title="Nội dung không khả dụng" />
        <div className="mx-auto max-w-xl rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-xl shadow-amber-900/5 sm:p-12">
          <img src={MALI_LOGO_URL} alt="Mali Edu" className="mx-auto h-16 w-auto object-contain" />
          <h1 className="mt-6 font-serif text-3xl font-bold text-secret-ink">Nội dung không khả dụng</h1>
          <p className="mt-3 text-slate-600">
            Link có thể đã được tắt chia sẻ hoặc nội dung không còn tồn tại.
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-secret-wax px-6 py-3 font-semibold text-white transition hover:bg-secret-ink"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </section>
    );
  }

  const isVideo = media.type.startsWith("video/");

  return (
    <>
      <SEO
        title={media.name}
        description="Nội dung được chia sẻ từ Mali Edu."
        url={`/xem/${media.id}`}
      />
      <section className="bg-gradient-to-b from-[#fbf5e6] via-white to-white px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-secret-gold/30 bg-white px-4 py-2 text-sm font-semibold text-secret-wax shadow-sm">
              {isVideo ? <PlayCircle className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
              Nội dung từ Mali Edu
            </div>
            <h1 className="mx-auto mt-4 max-w-3xl break-words font-serif text-2xl font-bold text-secret-ink sm:text-4xl">
              {media.name}
            </h1>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-2xl shadow-slate-900/15">
            {isVideo ? (
              <video
                src={media.mediaUrl}
                controls
                controlsList={media.allowDownload ? undefined : "nodownload"}
                playsInline
                preload="metadata"
                onContextMenu={media.allowDownload ? undefined : (event) => event.preventDefault()}
                className="mx-auto max-h-[78vh] w-full object-contain"
              />
            ) : (
              <img
                src={media.mediaUrl}
                alt={media.name}
                className="mx-auto max-h-[78vh] w-full object-contain"
              />
            )}
          </div>

          {isVideo && media.allowDownload && (
            <div className="mt-5 flex justify-center">
              <a
                href={media.downloadUrl}
                download
                className="inline-flex items-center gap-2 rounded-full border border-secret-wax px-5 py-2.5 text-sm font-semibold text-secret-wax transition hover:bg-secret-wax hover:text-white"
              >
                <Download className="h-4 w-4" />
                Tải video
              </a>
            </div>
          )}

          <div className="mt-10 rounded-3xl bg-secret-ink px-6 py-8 text-center text-white shadow-xl sm:px-10 sm:py-10">
            <img src={MALI_LOGO_URL} alt="Mali Edu" className="mx-auto h-16 w-auto object-contain" />
            <h2 className="mt-5 font-serif text-2xl font-bold sm:text-3xl">Khám phá thêm cùng Mali Edu</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Đồng hành trên hành trình khai mở tiềm thức, phát triển bản thân và kiến tạo cuộc sống thịnh vượng.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/khoa-hoc"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-secret-wax px-6 py-3 font-semibold text-white transition hover:bg-[#a33a3a]"
              >
                <BookOpen className="h-4 w-4" />
                Khám phá khóa học
              </Link>
              <Link
                to="/gioi-thieu"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white hover:text-secret-ink"
              >
                Tìm hiểu Mali Edu
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MediaShare;
