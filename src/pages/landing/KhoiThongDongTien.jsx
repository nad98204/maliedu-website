import Hero from "./components/Hero";
import PainSection from "./components/PainSection";
import TargetAudience from "./components/TargetAudience";
import ScheduleSection from "./components/ScheduleSection";
import ResultsSection from "./components/ResultsSection";
import FounderStorySection from "./components/FounderStorySection";
import StudentTestimonialsVideoSection from "./components/StudentTestimonialsVideoSection";
import TicketFormSection from "./components/TicketFormSection";

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
