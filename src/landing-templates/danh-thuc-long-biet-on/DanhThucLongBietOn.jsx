import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Gift, Heart, LoaderCircle, Sunrise, Users, X } from 'lucide-react';
import SEO from '../../components/SEO';
import { normalizeRegistrationPhone, submitCommunityRegistration } from '../../services/communityRegistrationService';
import config from './config.json';
import './Gratitude21.css';

const asset = '/assets/landing/21-ngay-long-biet-on/';
const practices = [
  ['01', 'Thực hành lòng biết ơn', 'Dành thời gian mỗi ngày để cảm nhận và thực hành lòng biết ơn.'],
  ['02', 'Mục tiêu đi cùng hành động', 'Thiết lập mục tiêu ngày – tuần và duy trì những hành động cụ thể.'],
  ['03', 'Rèn luyện tính kỷ luật', 'Thực hành các bài tập thôi miên tiềm thức trong suốt hành trình.'],
  ['04', 'Giải đáp câu hỏi', 'Trong các buổi học, Thành sẽ giải đáp các câu hỏi của học viên trong quá trình thực hành.'],
];

function RegistrationForm() {
  const [fields, setFields] = useState({ name: '', phone: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const sending = useRef(false);
  const successRef = useRef(null);
  const update = e => setFields(current => ({ ...current, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  async function submit(e) {
    e.preventDefault();
    if (sending.current) return;
    if (fields.name.trim().length < 2) { setError('Bạn nhập đầy đủ họ tên nhé.'); return; }
    if (!normalizeRegistrationPhone(fields.phone)) { setError('Bạn kiểm tra lại số điện thoại di động nhé. Hỗ trợ đầu số 0, 84 hoặc +84.'); return; }
    sending.current = true; setBusy(true); setError('');
    try {
      await submitCommunityRegistration({ ...fields, consent: true });
      setSuccess(true);
      requestAnimationFrame(() => successRef.current?.focus());
    } catch (e) { setError(e.message); }
    finally { sending.current = false; setBusy(false); }
  }
  if (success) return <div className="g21-success" tabIndex={-1} ref={successRef} role="status">
    <CheckCircle2 size={48} aria-hidden="true" />
    <p className="g21-eyebrow">Hẹn gặp bạn trong hành trình</p>
    <h3>Đã ghi nhận đăng ký của bạn!</h3>
    <p>Hãy vào nhóm Zalo để nhận thông tin tham gia chương trình. Bạn vẫn cần bấm tham gia nhóm để hoàn tất bước kết nối với cộng đồng nhé.</p>
    <a className="g21-button" href={config.zaloUrl} target="_blank" rel="noopener noreferrer">Vào nhóm Zalo ngay <ArrowRight size={18} /></a>
    <p className="g21-fine">Nhóm sẽ đóng khi đủ 1.000 thành viên.</p>
  </div>;
  return <form className="g21-form" onSubmit={submit} aria-label="Đăng ký thử thách 21 ngày">
    <p className="g21-eyebrow">Món quà dành tặng cộng đồng</p>
    <h3>Đăng ký tham gia miễn phí</h3>
    <p>Để lại thông tin và cùng Thành bắt đầu mỗi sáng với lòng biết ơn.</p>
    <label htmlFor="g21-name">Họ và tên <span>*</span></label>
    <input id="g21-name" name="name" autoComplete="name" placeholder="Họ và tên của bạn" required minLength={2} maxLength={120} value={fields.name} onChange={update} disabled={busy} />
    <label htmlFor="g21-phone">Số điện thoại <span>*</span></label>
    <input id="g21-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Nhập số điện thoại của bạn" required maxLength={24} value={fields.phone} onChange={update} disabled={busy} />
    <div className="g21-honeypot" aria-hidden="true"><label htmlFor="g21-website">Website</label><input id="g21-website" name="website" autoComplete="off" tabIndex={-1} value={fields.website} onChange={update} /></div>
    <p className="g21-privacy-note">Bằng việc bấm đăng ký, bạn đồng ý để Mali Edu sử dụng thông tin trên để hỗ trợ đăng ký và liên hệ về chương trình theo <a href="/chinh-sach-bao-mat" target="_blank" rel="noopener noreferrer">chính sách bảo mật</a>.</p>
    {error && <div className="g21-error" role="alert">{error}</div>}
    <button className="g21-button" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="g21-spin" size={19} />Đang gửi đăng ký…</> : <>Tôi muốn tham gia 21 ngày <ArrowRight size={18} /></>}</button>
    <p className="g21-fine"><Check size={14} />Hoàn toàn miễn phí · Không cần tạo tài khoản</p>
  </form>;
}

export default function DanhThucLongBietOn() {
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!registrationOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [registrationOpen]);
  const openRegistration = () => {
    // Stop a section link's ongoing smooth scroll before opening the form.
    window.scrollTo({ top: window.scrollY, left: window.scrollX, behavior: 'instant' });
    dialogRef.current?.showModal();
    setRegistrationOpen(true);
    dialogRef.current?.querySelector('input[name="name"]')?.focus({ preventScroll: true });
  };
  const closeRegistration = () => dialogRef.current?.close();
  const registrationTrigger = { type: 'button', onClick: openRegistration, 'aria-haspopup': 'dialog', 'aria-controls': 'g21-registration-dialog', 'data-registration-trigger': true };
  const now = Date.now();
  const start = new Date(`${config.startDate}T05:00:00+07:00`).getTime();
  const ended = now >= new Date(`${config.endDate}T23:59:59+07:00`).getTime();
  const status = ended ? 'Hành trình 21 ngày · 29/10 – 18/11/2026' : now >= start ? 'Hành trình đang diễn ra' : 'Cùng đón một hành trình mới';
  return <div className="g21-page">
    <SEO title="21 ngày đánh thức phép màu lòng biết ơn | Miễn phí" description={config.description} image={config.thumbnail} url={config.slug} preloadLcpImage={config.thumbnail} />
    <a className="g21-skip" href="#g21-main">Đến nội dung chính</a>
    <header className="g21-header">
      <div className="g21-shell g21-nav">
        <nav className="g21-links" aria-label="Điều hướng chương trình">
          <a href="#danh-cho-ai">Dành cho ai</a><a href="#hanh-trinh">Hành trình</a><a href="#dieu-ban-vun-dap">Nhận được gì</a><a href="#nguoi-chia-se">Người chia sẻ</a><a href="#loi-hen">Lời hẹn</a><button className="g21-nav-cta" {...registrationTrigger}>Đăng ký <ArrowRight size={15} /></button>
        </nav>
      </div>
    </header>
    <div id="g21-main" tabIndex={-1}>
      <section className="g21-hero">
        <div className="g21-shell g21-hero-grid">
          <div className="g21-hero-copy">
            <p className="g21-eyebrow"><span className="g21-status-dot" />{status}</p>
            <h1><span>Thử thách 21 ngày</span>Đánh thức phép màu <em>lòng biết ơn.</em></h1>
            <p className="g21-intro">Cùng Thành thực hành biết ơn, thiết lập mục tiêu và rèn kỷ luật — bắt đầu từ <strong>5h00 mỗi sáng.</strong></p>
            <button className="g21-button" {...registrationTrigger}>Đăng ký tham gia miễn phí <ArrowRight size={18} /></button>
            <p className="g21-hero-note"><Gift size={17} />Chương trình Thành dành tặng cộng đồng</p>
          </div>
          <figure className="g21-banner"><img src={config.thumbnail} width="1672" height="941" alt="Thử thách 21 ngày đánh thức phép màu lòng biết ơn, miễn phí, bắt đầu 29/10/2026 cùng Nguyễn Mong Thành và Mong Coaching" fetchPriority="high" /><figcaption>21 buổi sáng cùng nhau thực hành và hành động.</figcaption></figure>
        </div>
        <div className="g21-shell"><div className="g21-facts">
          <div><CalendarDays /><span>Bắt đầu<strong>29/10/2026</strong></span></div>
          <div><Clock3 /><span>Giờ Việt Nam<strong>5h00 mỗi sáng</strong></span></div>
          <div><Sunrise /><span>Đồng hành<strong>21 ngày liên tục</strong></span></div>
          <div><Gift /><span>Học phí<strong>Hoàn toàn miễn phí</strong></span></div>
        </div></div>
      </section>

      <section id="danh-cho-ai" className="g21-section g21-shell g21-audience">
        <div><p className="g21-eyebrow">Bạn có thấy mình trong những điều này?</p><h2>Chương trình này<br />dành cho bạn nếu…</h2></div>
        <ul>
          <li><CheckCircle2 size={21} /><p>Bạn muốn bắt đầu ngày mới với <strong>tinh thần tích cực hơn.</strong></p></li>
          <li><CheckCircle2 size={21} /><p>Bạn biết mình cần thay đổi nhưng thường <strong>trì hoãn hoặc bỏ dở.</strong></p></li>
          <li><CheckCircle2 size={21} /><p>Bạn muốn thực hành lòng biết ơn bằng <strong>những việc cụ thể mỗi ngày.</strong></p></li>
          <li><CheckCircle2 size={21} /><p>Bạn đang tìm một cộng đồng cùng <strong>học tập, thực hành và duy trì hành động.</strong></p></li>
        </ul>
      </section>

      <section id="hanh-trinh" className="g21-section g21-shell">
        <div className="g21-heading"><p className="g21-eyebrow">Mỗi sáng, một bước thực hành</p><h2>Trong hành trình này,<br />bạn sẽ cùng Thành…</h2></div>
        <div className="g21-practices">{practices.map(([number, title, description]) => <article key={number}><span className="g21-number">{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        <div className="g21-letter"><Heart size={28} aria-hidden="true" /><div><p>“Đây là chương trình Thành dành nhiều tâm huyết, đúc kết từ <strong>10 năm học hỏi, trải nghiệm và giảng dạy.</strong> Bạn hãy sắp xếp thời gian để cùng Thành đi trọn hành trình nhé!”</p><span>Nguyễn Mong Thành</span></div></div>
      </section>

      <section id="dieu-ban-vun-dap" className="g21-growth-section">
        <div className="g21-shell g21-section">
          <div className="g21-heading"><p className="g21-eyebrow">Từ những điều nhỏ, đều đặn mỗi ngày</p><h2>Điều bạn có thể vun đắp<br />trong 21 ngày</h2></div>
          <div className="g21-growth">
            <article><Sunrise size={28} /><h3>Thời gian cho chính mình</h3><p>Một khoảng thời gian mỗi sáng để trở về với chính mình.</p></article>
            <article><Heart size={28} /><h3>Thói quen biết ơn</h3><p>Một thói quen ghi nhận những điều đáng trân trọng.</p></article>
            <article><CheckCircle2 size={28} /><h3>Mục tiêu rõ ràng hơn</h3><p>Một mục tiêu rõ ràng hơn cho ngày và tuần.</p></article>
          </div>
          <p className="g21-growth-note">Qua từng buổi thực hành, bạn có cơ hội rèn sự đều đặn, quan sát cảm xúc và đưa điều mình học vào cuộc sống. Mỗi người sẽ có hành trình riêng, bắt đầu từ những thay đổi nhỏ mình sẵn sàng thực hiện.</p>
        </div>
      </section>

      <section id="nguoi-chia-se" className="g21-coaches-section">
        <div className="g21-shell g21-section">
          <div className="g21-heading"><p className="g21-eyebrow">Người chia sẻ</p><h2>Đồng hành cùng bạn<br />trong hành trình biết ơn</h2></div>
          <div className="g21-coaches">
            <article className="g21-coach"><div className="g21-portrait"><img src={asset + 'nguyen-mong-thanh.png'} alt="Nguyễn Mong Thành" width="750" height="750" loading="lazy" /></div><div className="g21-coach-copy"><span className="g21-eyebrow">Người dẫn dắt hành trình</span><h3>Nguyễn Mong Thành</h3><p>Với 10 năm học hỏi, trải nghiệm và giảng dạy, Thành dành tâm huyết cho việc đưa những bài học phát triển bản thân vào thực hành mỗi ngày.</p><p>Trong thử thách này, Thành sẽ cùng bạn thực hành lòng biết ơn, thiết lập mục tiêu, rèn tính kỷ luật và giải đáp các câu hỏi của học viên trong các buổi học.</p></div></article>
            <article className="g21-coach"><div className="g21-portrait g21-portrait-mong"><img src={asset + 'mong-coaching.png'} alt="Mong Coaching" width="750" height="1172" loading="lazy" /></div><div className="g21-coach-copy"><span className="g21-eyebrow">Người chia sẻ cùng chương trình</span><h3>Mong Coaching</h3><p>Nhà huấn luyện trong lĩnh vực Luật Hấp Dẫn, tiềm thức và nội tâm, với cách chia sẻ gần gũi, gắn nhận thức bên trong với hành động thực tế.</p><p>Mong Coaching đồng hành cùng học viên nhìn lại niềm tin, làm chủ cảm xúc và nuôi dưỡng nội lực để từng bước tạo ra những thay đổi tích cực trong cuộc sống.</p></div></article>
          </div>
        </div>
      </section>

      <section id="loi-hen" className="g21-section g21-shell g21-pledge">
        <div className="g21-heading"><p className="g21-eyebrow">Dành một lời hẹn cho bản thân</p><h2>Một lời hẹn với chính mình</h2></div>
        <blockquote>
          <p>“Tôi dành 21 buổi sáng để thực hành lòng biết ơn, làm rõ mục tiêu và hành động mỗi ngày.</p>
          <p>Tôi cho mình cơ hội học hỏi, kiên trì và bắt đầu lại khi cần. Tôi tham gia hành trình này với sự chủ động và tinh thần trân trọng.”</p>
        </blockquote>
        <p className="g21-pledge-preparation">Hãy chuẩn bị một cuốn sổ, một cây bút và sắp xếp thời gian để có mặt lúc <strong>5h00 sáng</strong> nhé!</p>
      </section>

      <section id="dang-ky" className="g21-register-section">
        <div className="g21-shell g21-register-grid">
          <div className="g21-register-copy"><p className="g21-eyebrow">Một món quà. Một hành trình cùng nhau.</p><Sunrise className="g21-register-sun" size={72} strokeWidth={1} aria-hidden="true" /><h2>Hẹn bạn<br />lúc <em>5h00 sáng.</em></h2><p>21 ngày dành thời gian cho chính mình, nuôi dưỡng lòng biết ơn và duy trì hành động mỗi ngày.</p><ul><li><Check />Bắt đầu từ 29/10/2026</li><li><Check />Thực hành liên tục trong 21 ngày</li><li><Check />Được giải đáp câu hỏi trong các buổi học</li></ul><div className="g21-group-note"><Users size={24} /><p>Nhóm Zalo sẽ đóng khi đủ <strong>1.000 thành viên.</strong> Sau khi đăng ký, bạn hãy vào nhóm để nhận thông tin tham gia.</p></div></div>
          <div className="g21-register-prompt"><Gift size={38} aria-hidden="true" /><p className="g21-eyebrow">Món quà dành tặng cộng đồng</p><h3>Đăng ký tham gia miễn phí</h3><p>Chỉ cần họ tên và số điện thoại để đăng ký hành trình 21 ngày cùng Thành.</p><button className="g21-button" {...registrationTrigger}>Đăng ký ngay <ArrowRight size={18} /></button><p className="g21-fine">Hoàn toàn miễn phí · Không cần tạo tài khoản</p></div>
        </div>
      </section>

      <section className="g21-shell g21-section g21-invite"><span className="g21-invite-mark" aria-hidden="true">“</span><p className="g21-eyebrow">Cùng Thành lan tỏa lòng biết ơn</p><h2>Một lời chia sẻ đúng lúc,<br />có thể mở ra một khởi đầu mới.</h2><p>Nếu bạn có người thân, bạn bè đang cần cải thiện năng lượng, tìm lại động lực và tạo ra những thay đổi tích cực trong cuộc sống, hãy chia sẻ chương trình và mời họ cùng tham gia.</p><p>Chương trình hoàn toàn miễn phí và có thể sẽ không được tổ chức lại trong thời gian tới. Hãy cùng Thành gieo hạt tri thức và lan tỏa lòng biết ơn đến nhiều người hơn nữa nhé! 💛</p><button className="g21-text-link" {...registrationTrigger}>Cùng tham gia hành trình <ArrowRight size={17} /></button></section>
    </div>
    <footer className="g21-footer"><div className="g21-shell"><span>MALI EDU · MONG COACHING</span><span>21 ngày đánh thức phép màu lòng biết ơn</span><a href="/chinh-sach-bao-mat">Chính sách bảo mật</a></div></footer>
    <button className="g21-mobile-cta" {...registrationTrigger}>Đăng ký miễn phí <ArrowRight size={18} /></button>
    <dialog id="g21-registration-dialog" ref={dialogRef} className="g21-dialog" aria-label="Đăng ký tham gia thử thách 21 ngày" onClose={() => setRegistrationOpen(false)} onClick={e => {
      if (e.target !== e.currentTarget) return;
      const bounds = e.currentTarget.getBoundingClientRect();
      if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) closeRegistration();
    }}>
      <button type="button" className="g21-dialog-close" aria-label="Đóng form đăng ký" onClick={closeRegistration}><X size={21} /></button>
      <RegistrationForm />
    </dialog>
  </div>;
}
