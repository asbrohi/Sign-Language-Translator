import React from "react";
import { FaStar, FaRegStarHalfStroke } from "react-icons/fa6";
import Navbar from "./components/Navbar";
import Contributor from "./components/Contributor";
import Footer from "./components/Footer";
import { Typewriter } from "react-simple-typewriter";
import "./Hero.css";

const Hero = () => {
  return (
    <>
      <Navbar />
      <div className="back-cover-content-wrapper">
        <div className="content-wrapper">
          <div className="left-content-wrapper">
            <h2>
              <span>Unlock Communication With</span>
              <span className="highlight-logo">
                {" "}
                <Typewriter
                  words={["SignEase."]}
                  loop={Infinity}
                  cursor
                  cursorStyle="|"
                  typeSpeed={100}
                  deleteSpeed={50}
                  delaySpeed={1000}
                />
              </span>
            </h2>
            <p>
              SignEase is your bridge to effortless communication, transforming
              sign language into clear and accessible text or speech. Our
              platform empowers you to connect with ease, breaking down barriers
              and fostering a world where everyone can be understood, no matter
              how they express themselves.
            </p>

            <div className="review-container">
              <p className="total-review">50+ Reviews</p>
              <span>
                <FaStar />
              </span>
              <span>
                <FaStar />
              </span>
              <span>
                <FaStar />
              </span>
              <span>
                <FaStar />
              </span>
              <span>
                <FaRegStarHalfStroke />
              </span>
            </div>
          </div>
          <div className="right-content-wrapper">
            <img src="/Image-for-hero-page.jpg" alt="background-image" />
          </div>
        </div>
      </div>
      <Contributor />
      <Footer />
    </>
  );
};

export default Hero;
