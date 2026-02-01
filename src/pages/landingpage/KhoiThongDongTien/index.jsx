import Hero from "./sections/Hero";
import PainSection from "./sections/PainSection";
import TargetAudience from "./sections/TargetAudience";
import ScheduleSection from "./sections/ScheduleSection";
import ResultsSection from "./sections/ResultsSection";
import FounderStorySection from "./sections/FounderStorySection";
import StudentTestimonialsVideoSection from "./sections/StudentTestimonialsVideoSection";
import TicketFormSection from "./sections/TicketFormSection";

const KhoiThongDongTien = () => {
  return (
    <div className="relative bg-[#FAF7F0] text-[#1E2A2F] min-h-screen">
      <Hero />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">
        <PainSection />
        <TargetAudience />
        <ScheduleSection />
        <ResultsSection />
        <FounderStorySection />
        <StudentTestimonialsVideoSection />
        <TicketFormSection />
      </div>
    </div>
  );
};

export default KhoiThongDongTien;
