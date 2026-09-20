// import Footer from "./components/footer";
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
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import NewTearcherAccount from "./pages/NewTearcherAccount";
import Aboutyou from "./pages/Aboutyou";
import TeacherLogin from "./pages/Teacherlogin";
import VerifyEmail from "./pages/VerifyEmail";
import Demographics from "./pages/Demographics";
import ForgotPassword from "./pages/ForgotPassword";
import TeacherDashboard from "./pages/TeacherDahboard";
import QuizLaunch from "./pages/QuizLaunch";
import LaunchSpace from "./pages/LaunchSpace";
import Library from "./pages/Library";
import Rooms from "./pages/Rooms";
import Reports from "./pages/Reports";
import LiveResults from "./pages/LiveResults";
import { Toaster } from "react-hot-toast";
import QuizGenerator from "./pages/Quizgenerator";
import { AuthProvider } from "./context/AuthContext";
import { TeacherAuthProvider } from "./context/TeacherAuthContext";
import ResetPassword from "./pages/ResetPassword";
import QuizEditor from "./pages/QuizEditor";
import StudentJoin from "./pages/StudentJoin";
import LinkedInHistory from "./pages/LinkedInHistory";
import AcademicEmailHistory from "./pages/AcademicEmailHistory";
import ReminderAgent from "./pages/ReminderAgent";
import SlideGenerator from "./pages/Slidegenerator";
import SlideHistory from "./pages/SlideHistory";
import PdfToSlideGenerator from "./pages/Pdftoslidegenerator";

export default function App() {
  return (
    <AuthProvider>
      <TeacherAuthProvider>
        <Toaster />
        <LenisScroll />
        {/* <Navbar /> */}
        <Routes>
          <Route path="/" element={<HomePage />}></Route>
          <Route path="/UseCases" element={<UseCases />} />
          <Route path="/login" element={<Login />}></Route>
          <Route
            path="/LinkedInPostGenerator"
            element={<LinkedInPostGenerator />}
          />
          <Route
            path="/AcademicEmailGenerator"
            element={<AcademicEmailGenerator />}
          />
          <Route path="/QuizGenerator" element={<QuizGenerator />} />
          <Route
            path="/Slidegenerator"
            element={<SlideGenerator />}
          />
          <Route
            path="/Pdf-to-SlideConverter"
            element={<PdfToSlidesConverter />}
          />
          <Route path="/Reminder" element={<TimetableReminder />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Settings" element={<Settings />} />
          <Route path="/NewTeacherAccount" element={<NewTearcherAccount />} />
          <Route path="/Demographics" element={<Demographics />} />
          <Route path="/Aboutyou" element={<Aboutyou />} />
          <Route path="/Teacherlogin" element={<TeacherLogin />} />
          <Route path="/VerifyEmail" element={<VerifyEmail />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path="/TeacherDashboard" element={<TeacherDashboard />} />
          <Route path="/QuizLaunch" element={<QuizLaunch />} />
          <Route path="/LaunchSpace" element={<LaunchSpace />} />
          <Route path="/Library" element={<Library />} />
          <Route path="/Rooms" element={<Rooms />} />
          <Route path="/Reports" element={<Reports />} />
          <Route path="/LiveResults" element={<LiveResults />} />
          <Route path="/ResetPassword" element={<ResetPassword />} />
          <Route path="/Quiz/Edit/:id" element={<QuizEditor />} />
          <Route path="/LiveResults/:id" element={<LiveResults />} />
          <Route path="/join" element={<StudentJoin />} />
          <Route path="/LinkedInHistory" element={<LinkedInHistory />} />
          <Route path="/AcademicEmailHistory" element={<AcademicEmailHistory />} />
          <Route path="*" element={<NotFound />} />
         <Route path="/ReminderAgent" element={<ReminderAgent />} />
          <Route path="/SlideHistory" element={<SlideHistory />} />
          <Route path="/Pdftoslidegenerator" element={<PdfToSlideGenerator/>}/>
        </Routes>
        {/* <Footer /> */}
      </TeacherAuthProvider>
    </AuthProvider>
  );
}