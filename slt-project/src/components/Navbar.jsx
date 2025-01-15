import React, { useState } from "react";
import { Link } from "react-router-dom"; 
import "./navbar.css";

const Navbar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLearnMoreClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <header className="navbar">
        <div className="logo-wrapper">
          /Sign<span className="half-logo">Ease</span>
        </div>
        <div className="navbar-buttons">
          {/* <button className="signin-button">Sign in</button> */}
          <Link to="/login" className="signin-button">
            Sign in
          </Link>
          <button className="learn-button" onClick={handleLearnMoreClick}>
            Learn More
          </button>
        </div>
      </header>

      {/* Modal Component */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>About the Project</h3>
            <p>
              Our Final Year Project (FYP) aims to develop a
              customizable Sign Language Translator tailored for individuals
              with traumatic brain injuries (TBIs), who often face cognitive and
              communication impairments. Existing sign language translators
              primarily cater to established systems like ASL and BSL, which may
              not suit TBI survivors. This project introduces a web interface
              allowing users to define personalized signs, train the model using
              few-shot learning, and translate these signs into both text and
              speech. By leveraging advanced image recognition and machine
              learning techniques, the solution fosters accessibility and
              communication for TBI survivors, enhancing their quality of life.
            </p>
            <button className="close-modal" onClick={handleCloseModal}>
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
