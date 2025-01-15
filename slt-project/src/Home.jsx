import React from "react";
import { Routes, Route } from "react-router-dom"; // Import Routes and Route
import Sidebar from "./components/Sidebar";
import HomeData from "./components/HomeData";
import AddGestures from "./components/AddGestures";
import VideoCalling from "./components/VideoCalling";
import VideoRecording from "./components/VideoRecording";
import RealTimeTranslation from "./components/RealTimeTranslation";
import "./home.css";

const Home = () => {
  return (
    <div className="wrapper">
      <div className="home-container">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<HomeData />} />
            <Route path="add-gestures" element={<AddGestures />} />
            <Route path="video-calling" element={<VideoCalling />} />
            <Route path="video-recording" element={<VideoRecording />} />
            <Route path="real-time-translation" element={<RealTimeTranslation />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Home;
