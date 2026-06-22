import FeaturedProjects from '@/components/landing/FeaturedProjects';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import Events from '@/components/landing/Events';
import FooterLanding from '@/components/landing/FooterLanding';
import HeaderLanding from '@/components/landing/HeaderLanding';

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <HeaderLanding />
      <HeroSection />
      <StatsSection />
      <FeaturedProjects />
      <Events />
      <FooterLanding />
    </main>
  );
}