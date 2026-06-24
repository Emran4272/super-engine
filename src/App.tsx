import useLenis from './hooks/useLenis';
import Navigation from './components/Navigation';
import PageLoader from './components/PageLoader';
import HeroSection from './sections/HeroSection';
import EphemeralFormSection from './sections/EphemeralFormSection';
import RitualsSection from './sections/RitualsSection';
import ArchiveSection from './sections/ArchiveSection';
import OlfactoryJourneySection from './sections/OlfactoryJourneySection';

export default function App() {
  useLenis();

  return (
    <>
      <PageLoader />
      <Navigation />
      <main>
        <HeroSection />
        <EphemeralFormSection />
        <RitualsSection />
        <ArchiveSection />
        <OlfactoryJourneySection />
      </main>
    </>
  );
}
