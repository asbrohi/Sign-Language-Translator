// VideoRecording.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './VideoRecording.css';

const VideoRecording = () => {
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // State to manage loading

  // Function to start recording with loading state
  const startRecording = () => {
    setError(null);
    setStatus('Please wait...');
    setIsLoading(true);

    // Wait for 3 seconds before initiating the recording action
    setTimeout(async () => {
      console.log('Attempting to start recording...');
      try {
        const response = await axios.post('http://localhost:5003/start-recording');
        console.log('Start Recording Response:', response.data);
        if (response.status === 200) {
          setStatus('Recording in progress...');
        } else {
          setStatus('Failed to start recording.');
          console.error('Failed to start recording.');
        }
      } catch (err) {
        console.error('Error starting recording:', err.response?.data || err.message);
        setError(err.response?.data || 'Error starting recording');
        setStatus('Idle');
      } finally {
        setIsLoading(false);
      }
    }, 3000); // 3 seconds delay
  };

  return (
    <div className="video-recording-wrapper">
      <h1 className="video-recording-heading">Video Recording</h1>
      
      {/* Start Recording Button */}
      <div className="button-container">
        <button
          className="start-btn"
          onClick={startRecording}
          disabled={isLoading} // Disable button during loading
          aria-disabled={isLoading} // Accessibility attribute
        >
          {isLoading ? (
            <>
              <span className="spinner"></span> Please wait...
            </>
          ) : (
            'Start Recording'
          )}
        </button>
      </div>

      {/* Display Status and Errors */}
      <div className="status-container">
        <p>Status: {status}</p>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default VideoRecording;
