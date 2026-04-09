import { Sparkles, Target, Star, HeartHandshake, ArrowRight } from "lucide-react";
import styles from "./MissionTimeline.module.css";

const fourPillars = [
  {
    title: "Khám phá Tiềm Thức",
    description: "Đánh thức sức mạnh ngủ quên để phục vụ mục tiêu của bạn.",
    Icon: Sparkles,
  },
  {
    title: "Luật Hấp Dẫn Ứng dụng",
    description: "Biến các quy luật vô hình thành kết quả hữu hình (tiền bạc, nhà cửa, sự nghiệp).",
    Icon: Target,
  },
  {
    title: "Phát triển Thịnh vượng",
    description: "Xây dựng tâm thế của người giàu có từ bên trong để thu hút vật chất bên ngoài.",
    Icon: Star,
  },
  {
    title: "Sống Cuộc Đời Tự Do Trọn Vẹn",
    description: "Kết hợp sự giàu có về vật chất với sự bình an trong tâm hồn để tận hưởng hạnh phúc trong từng khoảnh khắc.",
    Icon: HeartHandshake,
  },
];

const MissionTimeline = () => {
  return (
    <section className={`${styles.mission} py-12 lg:py-24`}>
      {/* Parchment gradient background */}
      <div className={styles.parchmentBg} />
      
      {/* Paper texture overlay */}
      <div 
        className={styles.paperTexture}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B4513' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className={styles.container}>
        
        {/* Header with Title & Quote */}
        <div className={styles.header}>
          {/* Wax Seal Badge */}
          <div className={styles.waxSeal}>
            <Sparkles className={styles.waxIcon} />
          </div>

          {/* Main Title */}
          <h2 className={styles.title}>
            SỨ MỆNH
            <span className={styles.titleWax}> MALI</span>
            <span className={styles.titleGold}> EDU</span>
          </h2>

          {/* Quote Box */}
          <div className={styles.quoteCard}>
            <div className={styles.quoteMarkLeft}>"</div>
            <div className={styles.quoteMarkRight}>"</div>
            <p className={styles.quoteText}>
              Cái gì có trong đầu, sẽ có trên tay.
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className={styles.grid}>
          
          {/* Left: Mission Story */}
          <div className={styles.left}>
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

            <a href="#" className={styles.cta}>
              Mali Edu – Cùng bạn kiến tạo cuộc đời thịnh vượng từ sức mạnh tâm thức.
              <ArrowRight className={styles.ctaIcon} />
            </a>
          </div>

          {/* Right: 4 Pillars Grid */}
          <div className={styles.right}>
            <div className={styles.pillars}>
              {fourPillars.map((pillar, idx) => (
                <article key={idx} className={styles.pillarCard}>
                  <div className={styles.pillarIcon}>
                    <pillar.Icon className={styles.pillarIconSvg} strokeWidth={1.5} />
                  </div>
                  <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                  <p className={styles.pillarDescription}>{pillar.description}</p>
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
