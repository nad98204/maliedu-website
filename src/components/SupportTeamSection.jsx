import styles from "./SupportTeamSection.module.css";

const teamMembers = [
  {
    id: "thanh-seven",
    name: "Thành Seven",
    role: "LEADER",
    tagline: "Dẫn dắt – Đồng hành – Giữ nhịp phát triển",
    photo:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767858349/Th%C3%A0nh_Seven_di3gc8.jpg",
    facebook: "https://facebook.com/thanhseven",
    zalo: "https://zalo.me/0123456789",
  },
  {
    id: "van-truong",
    name: "Văn Trường",
    role: "LEADER",
    tagline: "Dẫn dắt – Đồng hành – Giữ nhịp phát triển",
    photo:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767859693/V%C4%83n_Tr%C6%B0%E1%BB%9Dng_fb4t6g.jpg",
    facebook: "https://facebook.com/vantruong",
    zalo: "https://zalo.me/0123456789",
  },
  {
    id: "duc-tue",
    name: "Đức Tuệ",
    role: "LEADER",
    tagline: "Dẫn dắt – Đồng hành – Giữ nhịp phát triển",
    photo:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767858349/%C4%90%E1%BB%A9c_Tu%E1%BB%87_b4tqz7.jpg",
    facebook: "https://facebook.com/ductue",
    zalo: "https://zalo.me/0123456789",
  },
];

const SupportTeamSection = () => {
  return (
    <section className={`section ${styles.section} py-20 lg:py-24`}>
      <div className="container mx-auto px-4">
        <div className={`section-header ${styles.header}`}>
          <span className={styles.eyebrow}>TẬN TÂM - CHUYÊN NGHIỆP</span>
          <h2 className={styles.title}>
            Đội Ngũ Hỗ Trợ<br />
            Chuyên Nghiệp Của MALI
          </h2>
          <p className={styles.description}>
            Chúng tôi luôn sẵn sàng đồng hành cùng bạn trên hành trình phát triển
            bản thân. Đội ngũ hỗ trợ tận tâm của MALI đảm bảo bạn sẽ nhận được sự
            hỗ trợ nhanh chóng, nhiệt tình và chuyên nghiệp nhất.
          </p>
        </div>

        <div className={styles.grid}>
          {teamMembers.map((member) => (
            <article key={member.id} className={styles.card}>
              <div className={styles.imageWrap}>
                <img
                  src={member.photo}
                  alt={member.name}
                  loading="lazy"
                  className={styles.image}
                />
              </div>
              <div className={styles.info}>
                <p className={styles.name}>{member.name}</p>
                <span className={styles.role}>{member.role}</span>
                <p className={styles.tagline}>{member.tagline}</p>
                <div className={styles.socialLinks}>
                  <a href={member.facebook} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href={member.zalo} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Zalo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportTeamSection;
