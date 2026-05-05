// import FaqSection from "../sections/FqasSection";
import FaqSection from "../sections/FqasSection";
import FeaturesSection from "../sections/FeaturesSection";
import HeroSection from "../sections/HeroSection";
import Navbar from "../components/navbar";
import Footer from "../components/footer";


// import PricingSection from "../sections/pricing-section"
// import StatsSection from "../sections/stats-section"
// import TestimonialSection from "../sections/testimonial-section"


const HomePage = () => {
    return (
        <>
            <HeroSection />
            {/* <StatsSection /> */}
            <FeaturesSection />
            <FaqSection />
            {/* <PricingSection />
            <TestimonialSection /> */}
             <Navbar /> 
             <Footer />
        </>
    )
}


export default HomePage
