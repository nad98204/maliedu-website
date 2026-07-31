import SEO from "../components/SEO";

import CommunitySection from "../components/CommunitySection";
import FeaturedCourses from "../components/FeaturedCourses";
import HeroCarousel from "../components/HeroCarousel";
import MaliEcosystemSection from "../components/MaliEcosystemSection";
import MissionTimeline from "../components/MissionTimeline";
import ProgramsSection from "../components/ProgramsSection";
import SupportJourney from "../components/SupportJourney";
import SuccessStories from "../components/SuccessStories";
import SupportTeamSection from "../components/SupportTeamSection";
import { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from "../seo/routeSeo";

const Home = () => {
  return (
    <>
      <SEO jsonLd={[ORGANIZATION_SCHEMA, WEBSITE_SCHEMA]} />
      <HeroCarousel />

      <MaliEcosystemSection />
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
