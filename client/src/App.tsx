import Footer from "./components/footer";
import LenisScroll from "./components/lenis";
import Navbar from "./components/navbar";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./components/Login";
import SettingsPage from "./pages/settings";





export default function App() {
    return (
        <>
            <LenisScroll />
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />}></Route>
                <Route path="/login" element={<Login />}></Route>
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
            <Footer />
        </>
    )
}