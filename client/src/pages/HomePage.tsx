import FaqSection from "../sections/faq-section"
import FeaturesSection from "../sections/features-section"
import HeroSection from "../sections/hero-section"
import PricingSection from "../sections/pricing-section"
import StatsSection from "../sections/stats-section"
import TestimonialSection from "../sections/testimonial-section"


const HomePage = () => {
    return (
        <>
            <HeroSection />
            <StatsSection />
            <FeaturesSection />
            <FaqSection />
            <PricingSection />
            <TestimonialSection />
        </>
    )
}

export default HomePage
