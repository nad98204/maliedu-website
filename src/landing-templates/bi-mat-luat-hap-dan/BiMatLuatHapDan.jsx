import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Compass, LoaderCircle, LockKeyhole, Target } from "lucide-react";
import KhoiThongDongTien from "../khoi-thong-dong-tien/KhoiThongDongTien";
import { resolveKhoiThongLandingConfig } from "../khoi-thong-dong-tien/landingConfig";
import { submitToCRM } from "../../services/crmService";
import { createMetaEventId, getMetaBrowserData, initMetaPixel, trackMetaEventForPixel } from "../../utils/metaPixel";
import { buildSecretLead, SECRET_LANDING_NAME, SECRET_LANDING_PATH, validateSecretContact } from "./config";

const heroContent = {
  compact: true,
  title: SECRET_LANDING_NAME,
  question: "Bạn đã ứng dụng Luật Hấp Dẫn để thay đổi tài chính…",
  questionEmphasis: "nhưng DÒNG TIỀN VẪN CHƯA THAY ĐỔI?",
  description: <>Tìm ra điều đang khiến bạn thực hành không ra kết quả và cung cấp bạn tấm bản đồ rõ ràng— từ <strong className="font-black text-[#7A2113]">tư duy, cảm xúc đến hành động thực tế tạo ra tiền.</strong></>,
};
const painContent = {
  standalone: true,
  badge: "BẠN CÓ ĐANG GẶP?",
  heading: (
    <>
      <span className="inline-block">BẠN CÓ ĐANG GẶP</span>{" "}
      <span className="inline-block">NHỮNG VẤN ĐỀ NÀY</span>
    </>
  ),
  headingEmphasis: "TRONG QUÁ TRÌNH THỰC HÀNH LUẬT HẤP DẪN?",
  headingBreak: ["TRONG QUÁ TRÌNH THỰC HÀNH ", "LUẬT HẤP DẪN?"],
  items: [
    <>
      Muốn thực hành Luật Hấp Dẫn mà{" "}
      <strong className="font-bold text-[#8C0C12]">
        không biết bắt đầu từ đâu
      </strong>
      , bản thân cũng{" "}
      <strong className="font-bold text-[#8C0C12]">
        chưa thực sự tin
      </strong>{" "}
      sẽ ra được kết quả
    </>,
    <>
      Thực hành rất nhiều: <em>biết ơn, câu khẳng định, hình dung…</em> nhưng{" "}
      <strong className="font-bold text-[#8C0C12]">
        tài chính vẫn gần như không thay đổi
      </strong>
      .
    </>,
    <>
      <strong className="font-bold text-[#8C0C12]">
        Không biết mình đang sai ở đâu
      </strong>{" "}
      mà không hiệu quả: ở suy nghĩ, cảm xúc, niềm tin hay chính cách áp dụng Luật Hấp Dẫn chưa chuẩn.
    </>,
    <>
      Muốn giữ suy nghĩ tích cực nhưng những{" "}
      <strong className="font-bold text-[#8C0C12]">
        lo lắng, mệt mỏi và áp lực về tiền bạc
      </strong>{" "}
      và cuộc sống vẫn liên tục xuất hiện.
    </>,
    <>
      <strong className="font-bold text-[#8C0C12]">
        Biết quá nhiều phương pháp
      </strong>{" "}
      như 369, 555, câu khẳng định, viết kịch bản, hình dung, thông điệp tiềm thức… nhưng càng tìm hiểu{" "}
      <strong className="font-bold text-[#8C0C12]">càng rối</strong> và không biết nên tập trung vào cách nào.
    </>,
    <>
      Dành nhiều thời gian thực hành Luật Hấp Dẫn nhưng lại{" "}
      <strong className="font-bold text-[#8C0C12]">
        không biết mình cần đưa ra quyết định hay hành động gì
      </strong>{" "}
      trong thực tế để tài chính thực sự thay đổi.
    </>,
  ],
};
const audienceContent = {
  standalone: true,
  badge: "DÀNH CHO AI?",
  heading: (
    <>
      <span className="block text-[15px] min-[390px]:text-[16.5px] sm:text-xl lg:text-[1.85rem] text-[#4A1E08] leading-snug">
        CHƯƠNG TRÌNH NÀY SẼ PHÙ HỢP VỚI
      </span>
      <span className="block mt-1 sm:mt-1.5 text-[22px] min-[390px]:text-[26px] sm:text-2xl lg:text-[2.25rem] text-[#8C0C12] leading-tight tracking-tight">
        NHỮNG BẠN
      </span>
    </>
  ),
  cards: [
    {
      group: "NHÓM 01",
      titleDisplay: (
        <>
          <span>MUỐN BẮT ĐẦU – </span>
          <span className="text-[#8C0C12]">NHƯNG CHƯA BIẾT LÀM THẾ NÀO</span>
        </>
      ),
      painPoints: [
        "Chưa biết nên bắt đầu với phương pháp nào",
        "Muốn có một cách thực hành đơn giản, dễ hiểu",
        "Vẫn còn hoài nghi và muốn tự mình kiểm chứng",
      ],
    },
    {
      group: "NHÓM 02",
      titleDisplay: (
        <>
          <span>ĐÃ BIẾT – ĐÃ THỬ – </span>
          <span className="text-[#8C0C12]">NHƯNG CHƯA THẤY KẾT QUẢ</span>
        </>
      ),
      painPoints: [
        "Đã thử nhiều phương pháp nhưng chưa thấy chuyển biến rõ ràng",
        "Không biết mình đang làm sai ở đâu",
        "Bắt đầu nghi ngờ liệu mình có đang áp dụng đúng",
      ],
    },
    {
      group: "NHÓM 03",
      titleDisplay: (
        <>
          <span>MUỐN BIẾN LUẬT HẤP DẪN </span>
          <span className="text-[#8C0C12]">THÀNH HÀNH ĐỘNG THỰC TẾ</span>
        </>
      ),
      painPoints: [
        "Muốn biết bước tiếp theo mình cần làm là gì để tiến gần hơn tới mục tiêu.",
        "Muốn chủ động tạo ra kết quả, thay vì chỉ cầu nguyện, hình dung rồi chờ đợi.",
      ],
    },
  ],
};
const scheduleContent = {
  standalone: true,
  badge: "GIÁ TRỊ BẠN NHẬN ĐƯỢC",
  headingLead: "ĐẾN VỚI ỨNG DỤNG",
  headingEmphasis: "LUẬT HẤP DẪN ĐỂ KHƠI THÔNG DÒNG TIỀN",
  headingBreak: ["LUẬT HẤP DẪN ĐỂ", "KHƠI THÔNG DÒNG TIỀN"],
  headingTrail: "BẠN SẼ NHẬN ĐƯỢC:",
  items: [
    {
      title: "Hiểu đúng Luật Hấp Dẫn và Phước Đức",
      desc: (
        <>
          Vì sao <strong className="text-[#8C0C12] font-semibold">Phước Đức là nền tảng quan trọng</strong> khi ứng dụng Luật Hấp Dẫn vào cuộc sống và tài chính.
        </>
      ),
    },
    {
      title: "Nhận diện những “điểm nghẽn” khiến Luật Hấp Dẫn chưa hiệu quả",
      desc: (
        <>
          Từ <strong className="text-[#8C0C12] font-semibold">niềm tin, ám thị, cảm xúc</strong> đến những ảnh hưởng từ môi trường xung quanh.
        </>
      ),
    },
    {
      title: "Biết cách làm chủ cảm xúc và duy trì trạng thái năng lượng tích cực",
      desc: (
        <>
          Hạn chế những “nhiễu” khiến bạn <strong className="text-[#8C0C12] font-semibold">dễ mất niềm tin và lệch khỏi điều mình muốn</strong>.
        </>
      ),
    },
    {
      title: "Tìm ra mục tiêu kích hoạt lực thu hút tài chính mạnh nhất",
      desc: (
        <>
          Thay vì theo đuổi những <strong className="text-[#8C0C12] font-semibold">mục tiêu mơ hồ, thiếu cảm xúc và động lực</strong>.
        </>
      ),
    },
    {
      title: "Xây dựng lộ trình ứng dụng Luật Hấp Dẫn và kế hoạch hành động cụ thể",
      tag: "★ Trọng tâm",
      desc: (
        <>
          Để biết mình <strong className="text-[#8C0C12] font-semibold">cần thực hành gì và làm gì tiếp theo</strong> sau khóa học.
        </>
      ),
    },
  ],
};
const founderContent = {
  standalone: true,
  badge: "CÂU CHUYỆN THẬT",
  photoTag: "Tôi năm 2016",
  headingLead: "“TẠI SAO MÌNH ĐÃ CỐ GẮNG RẤT NHIỀU",
  headingBreak: ["MÀ CUỘC SỐNG", "VẪN KHÔNG THAY ĐỔI?”"],
  startingPoint: [
    "Hơn chục năm trước, tôi từng là một người rất khao khát thành công. Tôi đam mê đầu tư, muốn kiếm thật nhiều tiền và mong mình có thể thay đổi cuộc sống thật nhanh.",
    "Nhưng càng nóng vội, tôi càng đưa ra những quyết định sai lầm.",
    "Tôi từng bị lừa mất tiền, tiền tích lũy gần như tiêu tan, rơi vào nợ nần, mất việc và có giai đoạn không biết tương lai của mình sẽ đi về đâu.",
  ],
  struggles: [
    "Tôi là người tốt mà, tại sao cứ gặp toàn điều xui xẻo?",
    "Tôi đâu hại ai, sao mọi thứ cứ chống lại mình?",
    "Suốt nhiều tháng tôi sống trong tiêu cực, cố gắng kiếm tiền trả nợ, làm lại… mà mọi thứ vẫn cứ như vậy.",
  ],
  awakeningLead: "Khi tôi thực sự hiểu đúng về Luật Hấp Dẫn và Luật Nhân Quả tôi mới thấy mọi thứ trong năng lượng mình sai quá nhiều:",
  energyTraps: [
    {
      title: "Luôn kiếm tiền trong áp lực khổ sở và nóng vội",
      desc: "Khiến cho tiền khó đến, đến rồi lại đi.",
    },
    {
      title: "Nhiều ám thị sai lệch về tài chính bên trong",
      desc: "Mà những ám thị thông thường không thay đổi được.",
    },
    {
      title: "Chỉ mong cầu được quả tài chính mà không học cách gieo nhân Phước Đức",
      desc: "Càng cố gặt càng cạn dần tiền bạc.",
    },
  ],
  transformation: "Từ một người trắng tay, hôm nay tôi đã có một cuộc sống mới: tài chính vững vàng, năng lượng tích cực và một sứ mệnh trọn vẹn.",
  missionBadge: "TÔI MUỐN CHIA SẺ LẠI VỚI BẠN",
  missionTitle: "LỘ TRÌNH 3 BƯỚC KHƠI THÔNG DÒNG TIỀN",
  missionDesc: "Giúp bạn chuyển hoá tâm thức, gieo hạt phước báu và kết nối dòng chảy thịnh vượng bền vững.",
  quote: "“Dòng tiền chỉ bắt đầu khơi thông khi nội lực và năng lượng của bạn đủ vững vàng.”",
};
const ctaClass = "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#E8393F] to-[#9C0C12] px-3 sm:px-4 py-4 text-xs min-[375px]:text-sm font-black uppercase leading-snug text-[#FFE566] shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A2113] disabled:cursor-not-allowed disabled:opacity-60";
const inputClass = "mt-2 w-full rounded-xl border border-[#D4B572] bg-white px-4 py-3.5 text-base text-[#3A2208] outline-none transition focus:border-[#7A2113] focus:ring-2 focus:ring-[#C9961A]/30 disabled:opacity-60";
const errorClass = "mt-2 text-sm font-semibold text-[#9C0C12]";

function Registration({ config, reloadConfig }) {
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const sending = useRef(false);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("secret_landing_receipt") || "null");
      if (saved?.id && Date.now() - saved.createdAt < 30 * 60 * 1000) setReceipt(saved);
    } catch { /* Storage is optional. */ }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending.current || receipt) return;
    const nextErrors = validateSecretContact(contact);
    setErrors(nextErrors);
    setFailure("");
    if (Object.keys(nextErrors).length) {
      (nextErrors.name ? nameRef : phoneRef).current?.focus();
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const latest = await reloadConfig();
      const eventIds = { lead: createMetaEventId("lead"), registration: createMetaEventId("complete_registration") };
      let browserData = {};
      try { browserData = getMetaBrowserData(window.location.search); } catch { /* Tracking cannot block registration. */ }
      const payload = buildSecretLead({ contact, config: latest, url: window.location.href, browserData, eventIds });
      const result = await submitToCRM(payload);
      if (!result?.success || !result.id) throw new Error("Chưa gửi được đăng ký. Vui lòng thử lại.");
      const saved = { id: result.id, createdAt: Date.now(), zaloLink: latest.zaloLink };
      setReceipt(saved);
      try { sessionStorage.setItem("secret_landing_receipt", JSON.stringify(saved)); } catch { /* Registration is already saved. */ }
      try {
        if (latest.fbPixel) {
          initMetaPixel(latest.fbPixel);
          trackMetaEventForPixel(latest.fbPixel, "Lead", { content_name: SECRET_LANDING_NAME }, { eventID: eventIds.lead });
          trackMetaEventForPixel(latest.fbPixel, "CompleteRegistration", { content_name: SECRET_LANDING_NAME, status: true }, { eventID: eventIds.registration });
        }
      } catch { /* Pixel failures must not turn a saved lead into an error/retry. */ }
    } catch (error) {
      setFailure(error.message || "Chưa gửi được đăng ký. Bạn vui lòng thử lại.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  if (receipt) return <div className="rounded-2xl bg-[#FFFBF0] p-6 text-center text-[#5A3A1A] sm:p-10" role="status" aria-live="polite">
    <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-700" />
    <h3 className="text-2xl font-black text-[#7A2113]">Đăng ký thành công!</h3>
    <p className="my-5 leading-relaxed">Tham gia nhóm Zalo để nhận lịch học, đường dẫn vào lớp và tài liệu thực hành.</p>
    <a className={ctaClass} href={config?.zaloLink || receipt.zaloLink} target="_blank" rel="noopener noreferrer" onClick={() => {
      try { if (config?.fbPixel) trackMetaEventForPixel(config.fbPixel, "Contact", { content_name: SECRET_LANDING_NAME }); } catch { /* Optional tracking. */ }
    }}>Vào nhóm Zalo của lớp<ArrowRight size={18} /></a>
    <p className="mt-4 text-sm">Bạn sẽ học cùng lớp Khơi Thông Dòng Tiền của Mali Edu.</p>
  </div>;

  return <form className="rounded-2xl bg-[#FFFBF0] p-4 text-[#5A3A1A] sm:p-8" onSubmit={handleSubmit} noValidate aria-busy={busy}>
    <h3 className="text-lg sm:text-xl font-black uppercase text-[#7A2113]"><span className="inline-block">Nhận link học</span>{" "}<span className="inline-block">miễn phí</span></h3>
    <p className="mb-6 mt-2 text-sm leading-relaxed">Điền thông tin để nhận hướng dẫn tham gia 4 buổi học online.</p>
    <label className="block text-sm font-bold uppercase" htmlFor="secret-name">Họ và tên <span aria-hidden="true">*</span></label>
    <input className={inputClass} ref={nameRef} id="secret-name" name="name" autoComplete="name" placeholder="Họ và tên của bạn" maxLength={120} required value={contact.name} disabled={busy} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "secret-name-error" : undefined} onChange={e => { setContact({ ...contact, name: e.target.value }); setErrors({ ...errors, name: "" }); }} />
    {errors.name && <p className={errorClass} id="secret-name-error">{errors.name}</p>}
    <label className="mt-5 block text-sm font-bold uppercase" htmlFor="secret-phone">Số điện thoại Zalo <span aria-hidden="true">*</span></label>
    <input className={inputClass} ref={phoneRef} id="secret-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Số điện thoại Zalo" maxLength={20} required value={contact.phone} disabled={busy} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "secret-phone-error" : undefined} onChange={e => { setContact({ ...contact, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }} />
    {errors.phone && <p className={errorClass} id="secret-phone-error">{errors.phone}</p>}
    {config?.is_maintenance && <p className={errorClass} role="status">Lớp học đang tạm ngưng nhận đăng ký. Bạn vui lòng quay lại sau.</p>}
    {failure && <p className={errorClass} role="alert">{failure}</p>}
    <div className="mt-6"><button className={ctaClass} type="submit" disabled={busy || config?.is_maintenance}>{busy ? <><LoaderCircle className="animate-spin" size={19} />Đang gửi đăng ký…</> : <>Đăng ký miễn phí ngay<ArrowRight size={19} /></>}</button></div>
    <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#6A4A2A]"><LockKeyhole className="mt-0.5 shrink-0" size={14} />Thông tin của bạn được dùng để liên hệ và gửi hướng dẫn tham gia lớp học.</p>
  </form>;
}

export default function BiMatLuatHapDan() {
  const [config, setConfig] = useState(null);
  async function reloadConfig() {
    const next = await resolveKhoiThongLandingConfig({ path: SECRET_LANDING_PATH, fresh: true });
    setConfig(next);
    return next;
  }
  useEffect(() => {
    let active = true;
    resolveKhoiThongLandingConfig({ path: SECRET_LANDING_PATH }).then(next => { if (active) setConfig(next); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const scheduleDays = config?.ctaScheduleLabel?.replace(/\s*[-–·]\s*\d{1,2}(?:h|:)\d{2}.*$/i, "").trim();
  const registration = <section className="overflow-hidden rounded-3xl border border-[#E3C675] bg-gradient-to-b from-[#8A0D13] via-[#67070C] to-[#490307] px-3 py-6 shadow-2xl sm:px-8 sm:py-12" aria-labelledby="secret-register-title">
    <header className="mx-auto mb-7 max-w-3xl text-center">
      <span className="inline-flex rounded-full border border-[#F3D477]/40 bg-white/10 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-[#FFE99A]">Đăng ký tham gia miễn phí</span>
      <h2 id="secret-register-title" className="mt-4 text-[clamp(1.05rem,5.2vw,1.5rem)] font-black uppercase leading-tight text-white sm:text-4xl">Đăng ký 4 buổi học<span className="mt-1 block text-[#FFE566]">Hoàn toàn miễn phí</span></h2>
      <p className="mt-4 text-sm leading-relaxed text-[#F5E6B7] sm:text-base">Nhận link Zoom và hướng dẫn tham gia chương trình Khơi Thông Dòng Tiền.</p>
      <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-bold text-[#FFE99A]">{scheduleDays ? <><span>{scheduleDays}</span><span>20:00 – 22:00</span></> : "Lịch học được cập nhật trong nhóm Zalo"}</p>
    </header>
    <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2">
      <Registration config={config} reloadConfig={reloadConfig} />
      <img className="w-full rounded-2xl border border-[#D4B572]/50" src="/assets/landing/khoi-thong-dong-tien/registration-banner.webp" alt="Chương trình Khơi Thông Dòng Tiền — 4 buổi học online miễn phí" loading="lazy" decoding="async" />
    </div>
  </section>;
  return <KhoiThongDongTien seoPath={SECRET_LANDING_PATH} heroContent={heroContent} painContent={painContent} audienceContent={audienceContent} scheduleContent={scheduleContent} founderContent={founderContent} registration={registration} />;
}
