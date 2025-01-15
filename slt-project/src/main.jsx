import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Hero from "./Hero";
import SignIn from "./Pages/SignIn";
import ForgotPassword from "./Pages/ForgotPassword";
import SignUp from "./SignUp";
import Home from "./Home";
import AddGestures from "./components/AddGestures";
import VideoCalling from "./components/VideoCalling";
import VideoRecording from "./components/VideoRecording";
import RealTimeTranslation from "./components/RealTimeTranslation";
import HomeData from "./components/HomeData";
import "./main.css";
import "./index.css";

const pageTransition = {
  hidden: { opacity: 0, y: 100 }, // Start off below and invisible
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }, // Animate up into view
  exit: { opacity: 0, y: -100, transition: { duration: 0.3 } }, // Animate out of view to the top
};

const App = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              variants={pageTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Hero />
            </motion.div>
          }
        />
        <Route
          path="/login"
          element={
            <motion.div
              variants={pageTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <SignIn />
            </motion.div>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <motion.div
              variants={pageTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <ForgotPassword />
            </motion.div>
          }
        />

        <Route
          path="/signup"
          element={
            <motion.div
              variants={pageTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <SignUp />
            </motion.div>
          }
        />

        <Route
          path="/home/*"
          element={
            <motion.div
              variants={pageTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Home />
            </motion.div>
          }
        ></Route>

        <Route path="/Home-Data" element={<HomeData />} />
        <Route path="/Add-Gesture" element={<AddGestures />} />
        <Route path="/Video-Calling" element={<VideoCalling />} />
        <Route path="/Video-Recording" element={<VideoRecording />} />
        <Route path="/Translation" element={<RealTimeTranslation />} />
      </Routes>
    </AnimatePresence>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
