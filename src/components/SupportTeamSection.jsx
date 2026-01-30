import styles from "./SupportTeamSection.module.css";

const teamMembers = [
  {
    id: "thanh-seven",
    name: "Thành Seven",
    role: "LEADER",
    tagline: "Dẫn dắt – Đồng hành – Giữ nhịp phát triển",
    photo:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767858349/Th%C3%A0nh_Seven_di3gc8.jpg",
  },
  {
    id: "van-truong",
    name: "Văn Trường",
    role: "LEADER",
    tagline: "Dẫn dắt – Đồng hành – Giữ nhịp phát triển",
    photo:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767859693/V%C4%83n_Tr%C6%B0%E1%BB%9Dng_fb4t6g.jpg",
  },
  {
    id: "duc-tue",
    name: "Đức Tuệ",
    role: "LEADER",
    tagline: "Dẫn dắt – Đồng hành – Giữ nhịp phát triển",
    photo:
      "https://res.cloudinary.com/dstukyjzd/image/upload/v1767858349/%C4%90%E1%BB%A9c_Tu%E1%BB%87_b4tqz7.jpg",
  },
];

const SupportTeamSection = () => {
  return (
    <section className={`section ${styles.section} py-10 lg:py-24`}>
      <div className="container mx-auto px-4">
        <div className={`section-header ${styles.header}`}>
          <span className={styles.eyebrow}>TẬN TÂM - CHUYÊN NGHIỆP</span>
          <h2 className={styles.title}>Đội Ngũ Hỗ Trợ Chuyên Nghiệp Của MALI</h2>
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
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportTeamSection;
