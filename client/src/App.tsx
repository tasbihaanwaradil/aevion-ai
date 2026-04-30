import Footer from "./components/footer";
import LenisScroll from "./components/lenis";
// import Navbar from "./components/navbar";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UseCases from "./pages/UseCases";
import Login from "./components/Login";
import LinkedInPostGenerator from "./pages/LinkedInPostGenerator";
import AcademicEmailGenerator from "./pages/AcademicEmailGenerator";
import AutoCreatePresentationSlides from "./pages/AutoCreatePresentationSlides";
import PdfToSlidesConverter from "./pages/Pdf-to-SlideConverter";
import Dashboard  from "./pages/Dashboard";






export default function App() {
    return (
        <>
            <LenisScroll />
            {/* <Navbar /> */}
            <Routes>
                <Route path="/" element={<HomePage />}></Route>
                <Route path="/UseCases" element={<UseCases />} />
                <Route path="/login" element={<Login />}></Route>
                <Route path="/LinkedInPostGenerator" element={<LinkedInPostGenerator/>}/>
                <Route path="/AcademicEmailGenerator" element={<AcademicEmailGenerator/>}/>
                <Route path="/AutoCreatePresentationSlides" element={<AutoCreatePresentationSlides/>}/>
                <Route path="/Pdf-to-SlideConverter" element={<PdfToSlidesConverter/>}/>
                <Route path="/Dashboard" element={<Dashboard/>}/>
                
            </Routes>
            <Footer />
        </>
    )
}