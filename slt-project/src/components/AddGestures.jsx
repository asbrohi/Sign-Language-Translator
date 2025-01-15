// AddGestures.jsx

import React, { useState } from "react";
import axios from "axios";
import "./AddGestures.css";

const AddGestures = () => {
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false); // State for loading

  // Open the modal
  const handleTipClick = () => {
    setIsModalOpen(true);
  };

  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Function to start data collection with loading state
  const startDataCollection = () => {
    setError(null);
    setStatus("Please wait...");
    setIsLoading(true);

    // Wait for 3 seconds before starting data collection
    setTimeout(async () => {
      console.log("Attempting to start data collection...");
      try {
        const response = await axios.post("http://localhost:5003/start-datacollection");
        if (response.status === 200) {
          setStatus("Data collection in progress...");
          console.log("Data collection started successfully.");
        } else {
          setStatus("Failed to start data collection.");
          console.error("Failed to start data collection.");
        }
      } catch (error) {
        console.error("Error starting data collection:", error.response?.data || error.message);
        let errorMsg = "Error starting data collection.";
        if (error.response) {
          // Server responded with a status other than 2xx
          errorMsg = error.response.data.message || errorMsg;
        } else if (error.request) {
          // Request was made but no response received
          errorMsg = "No response from server. Please try again.";
        } else {
          // Something else happened
          errorMsg = error.message;
        }
        setError(errorMsg);
        setStatus("Idle");
      } finally {
        setIsLoading(false);
      }
    }, 3000); // 3 seconds delay
  };

  return (
    <>
      <div className="btn-div">
        <button className="tip-button" onClick={handleTipClick}>Tip</button>
      </div>

      <div className="add-gestures-wrapper">
        <h1 className="add-gestures-heading">Add Gestures</h1>

        <div className="button-container">
          <button
            className="start-btn"
            onClick={startDataCollection}
            disabled={isLoading} // Disable button during loading
            aria-disabled={isLoading} // Accessibility attribute
            aria-label="Start Data Collection"
          >
            {isLoading ? (
              <>
                <span className="spinner"></span> Please wait...
              </>
            ) : (
              "Start Data Collection"
            )}
          </button>
        </div>

        {/* Display Status and Errors */}
        <div className="status-container">
          <p>Status: {status}</p>
          {error && <p className="error-message">{error}</p>}
        </div>

        {/* Instructional Label Wrapped in a Styled Div */}
        <div className="instruction-crystal">
          <p className="instruction-label">
          If you have added a new sign gesture, please wait for up to 5 minutes to allow the model to retrain itself. 
          This process ensures the newly added gestures are incorporated into the model.
          </p>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Tip</h3>
            <p>
              To ensure comprehensive training and improve the model's understanding,
              it is essential to incorporate a variety of input sequences during data collection.
              Aim for an equal balance between one-handed and two-handed gestures,
              preferably a 50/50 distribution. Additionally, introduce spatial
              variations by capturing gestures at different distances,
              including positions closer to and farther from the camera.
              Vary hand movements, angles, and orientations to further
              diversify the dataset. These variations will help create
              a robust and adaptable model capable of handling a wide
              range of real-world scenarios.
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

export default AddGestures;