import { Brain, Magnet, TrendingUp, Sun } from "lucide-react";
import styles from "./MissionTimeline.module.css";

const values = [
  {
    title: "Khai mở Tiềm thức",
    description: "Đánh thức sức mạnh ngủ quên để phục vụ mục tiêu của bạn.",
    icon: Brain,
  },
  {
    title: "Luật Hấp Dẫn Ứng dụng",
    description:
      "Biến các quy luật vô hình thành kết quả hữu hình (tiền bạc, nhà cửa, sự nghiệp).",
    icon: Magnet,
  },
  {
    title: "Phát triển Thịnh vượng",
    description:
      "Xây dựng tâm thế của người giàu có từ bên trong để thu hút vật chất bên ngoài.",
    icon: TrendingUp,
  },
  {
    title: "Sống Cuộc Đời Tự Do Trọn Vẹn",
    description:
      "Kết hợp sự giàu có về vật chất với sự bình an trong tâm hồn để tận hưởng hạnh phúc trong từng khoảnh khắc.",
    icon: Sun,
  },
];

const MissionTimeline = () => {
  return (
    <section className={`section ${styles.mission} py-10 lg:py-24`}>
      <div className={styles.bg} />
      <div className={styles.noise} />
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.left}>

            <h2 className={styles.title}>
              SỨ MỆNH <br className="lg:hidden" /> <span className={styles.highlight}>MALI EDU</span>
            </h2>

            <div className={styles.quoteCard}>
              <div className={styles.quoteInline}>
                <span className={styles.quoteMark}>“</span>
                <p className={styles.quoteText}>Cái gì có trong đầu, sẽ có trên tay.</p>
                <span className={`${styles.quoteMark} ${styles.quoteMarkRight}`}>”</span>
              </div>
            </div>

            <div className={styles.body}>
              <p>
                Sứ mệnh của Mali Edu là hiện thực hóa câu nói đó cho hàng triệu người Việt Nam
                thông qua việc làm chủ Luật Hấp Dẫn.
              </p>
              <p>
                Chúng tôi tin rằng Luật Hấp Dẫn không phải là sự chờ đợi phép màu, mà là khoa học
                của sự tập trung và niềm tin. Mali Edu tập trung trang bị cho bạn tư duy đúng, công
                cụ đúng để Manifest (Kiến tạo) chính xác những gì bạn khao khát: Tự do tài chính,
                mối quan hệ hoàn hảo và sự bình an nội tại.
              </p>
            </div>

            <p className={styles.closing}>
              Mali Edu – Cùng bạn kiến tạo cuộc đời thịnh vượng từ sức mạnh tâm thức.
            </p>
          </div>

          <div className={styles.right}>
            <div className={styles.values}>
              {values.map((value, idx) => (
                <article key={value.title} className={styles.valueCard}>
                  <div className={styles.valueIcon} aria-hidden="true">
                    <value.icon className={styles.lucideIcon} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className={styles.valueTitle}>{value.title}</h3>
                    <p className={styles.valueDescription}>{value.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionTimeline;
