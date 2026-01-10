import Footer from "./components/footer";
import LenisScroll from "./components/lenis";
import Navbar from "./components/navbar";
import FaqSection from "./sections/faq-section";
import FeaturesSection from "./sections/features-section";
import HeroSection from "./sections/hero-section";
import OurTeamSection from "./sections/our-team";
import PricingSection from "./sections/pricing-section";
import StatsSection from "./sections/stats-section";
import TestimonialSection from "./sections/testimonial-section";

export default function App() {
    return (
        <div>
            <LenisScroll />
            <Navbar />
            <HeroSection />
            <StatsSection />
            <FeaturesSection />
            <FaqSection />
            <OurTeamSection />
            <PricingSection />
            <TestimonialSection />
            <Footer />
        </div>
    )
}