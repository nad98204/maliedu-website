const COMMUNITY_IMAGE_URL =
  "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1779204979511-470024008-C-ng---ng-lu-t-h-p-d-n.jpg";
const COMMUNITY_LINK =
  "https://www.facebook.com/groups/1567840277339435";

const AVATARS = [
  {
    src: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1779205465221-26736724-Th-nh-Seven.jpg",
    initials: "AN",
  },
  {
    src: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1779205465942-91679980-V-n-Tr--ng.jpg",
    initials: "TU",
  },
  {
    src: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/files/1779205466365-83289387---c-Tu-.jpg",
    initials: "MY",
  },
  {
    src: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1777965254335-679939279-Avatar.jpg",
    initials: "NG",
  },
  {
    src: "https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1776223771769-356869318-FULL-SIZE.png",
    initials: "LH",
  },
];

const CommunitySection = () => {
  const handleJoin = () => {
    window.open(COMMUNITY_LINK, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="section relative bg-[#fbf6ef] py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7),transparent_65%)]" />
      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="flex justify-center lg:justify-start">
            <div className="rounded-3xl bg-white/70 p-2 sm:p-3 shadow-xl ring-1 ring-black/5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl">
              <div className="overflow-hidden rounded-2xl bg-white">
                <img
                  src={COMMUNITY_IMAGE_URL}
                  alt="Cộng đồng Mali"
                  width="1255"
                  height="684"
                  className="w-full h-auto object-contain aspect-[1255/684]"
                />
              </div>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.28em] text-secret-gold mb-4">
              KẾT NỐI & CHIA SẺ
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-4xl font-semibold text-secret-ink mb-8">
              Tham Gia Cộng Đồng Mali
            </h2>
            <p className="text-base sm:text-lg text-secret-ink/80 leading-relaxed mb-8">
              Hãy trở thành một phần của cộng đồng những người tích cực, cùng
              nhau học hỏi, chia sẻ kinh nghiệm về Luật Hấp Dẫn và phát triển
              bản thân mỗi ngày.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-center lg:justify-start">
              <button
                type="button"
                onClick={handleJoin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-8 py-4 text-white font-semibold shadow-md transition-all duration-300 hover:bg-[#1464cf] hover:shadow-lg"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22 12.1C22 6.5 17.5 2 11.9 2S1.8 6.5 1.8 12.1c0 5 3.6 9.1 8.3 9.9v-7H7.7v-2.9h2.4V9.9c0-2.4 1.4-3.7 3.5-3.7 1 0 2 .2 2 .2v2.3h-1.1c-1.1 0-1.4.7-1.4 1.4v1.7h2.5l-.4 2.9h-2.1v7c4.7-.8 8.3-4.9 8.3-9.9z" />
                </svg>
                Tham Gia Cộng Đồng Ngay
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {AVATARS.map((avatar, index) => (
                    <div
                      key={avatar.src}
                      className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden ring-2 ring-white shadow-sm bg-gradient-to-br from-[#f3c9a9] to-[#c98e65] flex items-center justify-center text-[11px] font-semibold text-white"
                      style={{ zIndex: AVATARS.length - index }}
                    >
                      <span>{avatar.initials}</span>
                      <img
                        src={avatar.src}
                        alt="Thành viên cộng đồng"
                        width="44"
                        height="44"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#5f6b78]">
                  Hàng ngàn thành viên đang chờ bạn!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
