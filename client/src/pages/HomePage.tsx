import FaqSection from "../sections/FqasSection";
import FeaturesSection from "../sections/FeaturesSection";
import HeroSection from "../sections/HeroSection";
import TestimonialSection from "../sections/testimonial-section";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

// import PricingSection from "../sections/pricing-section"
// import StatsSection from "../sections/stats-section"

const HomePage = () => {
    return (
        <>
            <HeroSection />
            {/* <StatsSection /> */}
            <FeaturesSection />
            <TestimonialSection />
            <FaqSection />
            {/* <PricingSection /> */}
            <Navbar />
            <Footer />
        </>
    )
}

export default HomePage