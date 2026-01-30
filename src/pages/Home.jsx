import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";

import AboutSection from "../components/AboutSection";
import CommunitySection from "../components/CommunitySection";
import FeaturedCourses from "../components/FeaturedCourses";
import HeroCarousel from "../components/HeroCarousel";
import MissionTimeline from "../components/MissionTimeline";
import ProgramsSection from "../components/ProgramsSection";
import SupportJourney from "../components/SupportJourney";
import SuccessStories from "../components/SuccessStories";
import SupportTeamSection from "../components/SupportTeamSection";

const Home = () => {
  const navigate = useNavigate();


  return (
    <>
      <SEO />
      <HeroCarousel />

      <AboutSection />
      <MissionTimeline />
      <ProgramsSection />

      {/* FEATURED COURSES SECTION */}
      <FeaturedCourses />

      <SupportTeamSection />
      <SuccessStories />
      <SupportJourney />
      <CommunitySection />
    </>
  );
};

export default Home;
