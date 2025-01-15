import React, { useState, useEffect } from "react";
import { Typewriter } from "react-simple-typewriter";
import { Card, Row, Col } from "antd";
import {
  CheckCircleOutlined,
  RadarChartOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import "./HomeData.css";

const images = ["/Image1.jpg", "/Image2.jpg", "/Image3.jpg"];

const sentences = [
  "SignEase Helps TBI Survivors Communicate.",
  "Customized Translators Meet Individual Needs.",
  "Enhance Understanding Between Survivors, Caregivers.",
  "Promote Independence, Inclusion, Social Engagement.",
];

const HomeData = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState("fade-in");

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setFadeClass("fade-out");
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        setFadeClass("fade-in");
      }, 500); // 500ms fade-out duration
    }, 3000);

    return () => clearInterval(imageInterval);
  }, []);

  return (
    <div className="home-data-container">
      <h1 className="home-heading">Home</h1>
      <div className="content-container">
        {/* Left Container with Images */}
        <div className="left-container">
          <img
            src={images[currentImageIndex]}
            alt={`Slide ${currentImageIndex}`}
            className={`image ${fadeClass}`}
          />
        </div>

        {/* Right Container with Typing Text */}
        <div className="right-container">
          <div className="typewriter-text">
            <Typewriter
              words={sentences}
              loop={Infinity}
              cursor
              cursorStyle="|"
              typeSpeed={100} // Adjusted to 100ms per character
              deleteSpeed={50}
              delaySpeed={1000}
            />
          </div>
        </div>
      </div>

      {/* New Section with Stats Heading and Cards */}
      <div className="stats-container">
        {/* Stats Section Heading */}
        <h1 className="home-heading">Stats</h1>

        {/* Grid with 2 rows and 2 cards per row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12}>
            <Card className="stat-card">
              <CheckCircleOutlined className="stat-icon" />
              <h2>Accuracy</h2>
              <p>95%</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Card className="stat-card">
              <RadarChartOutlined className="stat-icon" />
              <h2>F1 Score</h2>
              <p>93%</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Card className="stat-card">
              <ReloadOutlined className="stat-icon" />
              <h2>Recall</h2>
              <p>92%</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Card className="stat-card">
              <TeamOutlined className="stat-icon" />
              <h2>Support</h2>
              <p>1000+ Users</p>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HomeData;
