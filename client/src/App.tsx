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
import TimetableReminder from "./pages/Reminder";
import PdfToSlidesConverter from "./pages/Pdf-to-SlideConverter";
import Dashboard  from "./pages/Dashboard";
import Settings from "./pages/Settings";

import { Toaster } from 'react-hot-toast'





export default function App() {
    return (
        <>
            <Toaster />
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
                <Route path="/Reminder" element={<TimetableReminder/>}/>
                <Route path="/Dashboard" element={<Dashboard/>}/>
                <Route path="/settings" element={<Settings />} />
            </Routes>
            <Footer />
        </>
    )
}