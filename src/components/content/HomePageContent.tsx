import Navbar from "@/src/components/shared/Navbar";
import Footer from "@/src/components/shared/Footer";
import HeroSection from "@/src/components/homeContent/sections/HeroSection";
import WelcomeSection from "@/src/components/homeContent/sections/WelcomeSection";
import DevotionSection from "@/src/components/homeContent/sections/DevotionSection";
import AnnouncementsSection from "@/src/components/homeContent/sections/AnnouncementsSection";
import SermonsSection from "@/src/components/homeContent/sections/SermonsSection";
import SocialClipsSection from "@/src/components/homeContent/sections/SocialClipsSection";
import GamesSection from "@/src/components/homeContent/sections/GamesSection";
import YouTubeDirectorySection from "@/src/components/homeContent/sections/YouTubeDirectorySection";
import PrayerRequestSection from "@/src/components/homeContent/sections/PrayerRequestSection";
import GivingSection from "@/src/components/homeContent/sections/GivingSection";
export default function HomePageContent() {
  return (
    <>
      <Navbar />
      {/* <LiveBanner isLive={true} /> */}
      <main>
        <HeroSection />
        <WelcomeSection />
        <DevotionSection />
        <AnnouncementsSection />
        <SermonsSection />
        <SocialClipsSection />
        <GamesSection />
        <YouTubeDirectorySection />
        <PrayerRequestSection />
        <GivingSection />
      </main>
      <Footer />
    </>
  );
}
