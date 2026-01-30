import styles from "./SupportJourney.module.css";

const supportCards = [
  {
    id: "coaching",
    keyword: "LẮNG NGHE SÂU",
    title: "Coaching 1:1 Cá Nhân Hóa",
    description:
      "Bạn được lắng nghe, nhìn thẳng vào vấn đề cốt lõi và nhận sự dẫn dắt phù hợp với hoàn cảnh, mục tiêu và giai đoạn phát triển của chính mình.",
    accent: "#3a7a4e",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7.5 18.5a4.5 4.5 0 0 1 0-9 5.5 5.5 0 0 1 10.5 2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M15 20c2.5 0 4.5-1.9 4.5-4.2S17.5 11.5 15 11.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M8.2 13.3h6.6M10.5 10.6l-2.3 2.7 2.3 2.7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "roadmap",
    keyword: "TỪ RÕ → ĐẾN LÀM",
    title: "Xây Dựng Mục Tiêu & Lộ Trình Rõ Ràng",
    description:
      "Không mơ hồ, không áp khuôn. Mỗi mục tiêu đều được cụ thể hóa và chuyển thành lộ trình hành động phù hợp với năng lực thực tế.",
    accent: "#c9a227",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 6h14M5 12h10M5 18h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M18 11l2 1.5-2 1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "relationships",
    keyword: "KẾT NỐI TỈNH THỨC",
    title: "Phát Triển Quan Hệ & Giao Tiếp Tỉnh Thức",
    description:
      "Cải thiện chất lượng các mối quan hệ trong gia đình, công việc và cộng đồng thông qua tư duy đúng và kỹ năng giao tiếp hiệu quả.",
    accent: "#b14a3a",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 20s-6.5-4.2-8.2-8c-1.1-2.6.4-5.8 3.4-6.3 1.7-.3 3.3.4 4.2 1.8.9-1.4 2.5-2.1 4.2-1.8 3 .5 4.5 3.7 3.4 6.3-1.7 3.8-8.2 8-8.2 8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
  {
    id: "resilience",
    keyword: "KHÔNG PHỤ THUỘC CẢM XÚC",
    title: "Củng Cố Nội Lực & Động Lực Bền Vững",
    description:
      "Giúp bạn duy trì sự tự tin, năng lượng tích cực và khả năng hành động lâu dài, không phụ thuộc vào cảm xúc nhất thời.",
    accent: "#6b0f1a",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4l6 3v4c0 4.2-2.6 7.9-6 9-3.4-1.1-6-4.8-6-9V7l6-3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M9.2 12.2l2 2.2 3.6-4.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const SupportJourney = () => {
  return (
    <section className={`section ${styles.section}`}>
      <div className={styles.container}>
        <div className={`section-header ${styles.header}`}>
          <h2 className={styles.title}>Bạn Không Phải Tự Đi Một Mình</h2>
          <p className={styles.subHeadline}>
            Mali Đồng Hành – Hỗ Trợ – Dẫn Dắt Đến Khi Bạn Tự Vững
          </p>
          
          <div className={styles.divider}>
            <span className={styles.dividerIcon} />
          </div>

          <p className={styles.introQuote}>
            Mỗi người đều có một hành trình phát triển riêng.
          </p>
          <p className={styles.introBody}>
            Mali EDU đồng hành cùng bạn bằng sự thấu hiểu, kinh nghiệm thực
            tiễn và những công cụ đã được kiểm chứng, giúp bạn tháo gỡ giới hạn
            bên trong, xây dựng nội lực vững vàng và tiến bước một cách chủ
            động, bền vững.
          </p>
        </div>

        <div className={`section-content ${styles.cards}`}>
          {supportCards.map((card, index) => (
            <article
              key={card.id}
              className={styles.card}
            >
              <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
              
              <span className={styles.cornerTL} aria-hidden="true" />
              <span className={styles.cornerTR} aria-hidden="true" />
              <span className={styles.cornerBL} aria-hidden="true" />
              <span className={styles.cornerBR} aria-hidden="true" />

              <div className={styles.waxSeal}>
                {card.icon}
              </div>
              
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDescription}>{card.description}</p>
              </div>

              <div className={styles.secretMark} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-11v6h2v-6h-2z" />
                </svg>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.cta}>
          <a href="#contact" className={styles.ctaLink}>
            Xem lộ trình phù hợp với tôi
          </a>
        </div>
      </div>
    </section>
  );
};

export default SupportJourney;
