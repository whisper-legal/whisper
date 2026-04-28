import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import CoreFeatures from "../components/landing/CoreFeatures";
import HowItWorks from "../components/landing/HowItWorks";
import PrivacySection from "../components/landing/PrivacySection";
import OfflineOnline from "../components/landing/OfflineOnline";
import UseCases from "../components/landing/UseCases";
import AdvancedFeatures from "../components/landing/AdvancedFeatures";
import VisionSection from "../components/landing/VisionSection";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />
      
      <main>
        <Hero />
        
        <div id="features">
          <CoreFeatures />
        </div>
        
        <div id="how">
          <HowItWorks />
        </div>
        
        <OfflineOnline />
        
        <div id="privacy">
          <PrivacySection />
        </div>
        
        <UseCases />
        
        <AdvancedFeatures />
        
        <div id="vision">
          <VisionSection />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}