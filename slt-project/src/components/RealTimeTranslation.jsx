// RealTimeTranslation.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './RealTimeTranslation.css';

const RealTimeTranslation = () => {
  const [status, setStatus] = useState('Idle');
  const [isTranslating, setIsTranslating] = useState(false); // To manage translation state
  const [error, setError] = useState(null);

  const [isLoading, setIsLoading] = useState(false); // New state for loading

  // Function to start translation with loading state
  const startTranslation = () => {
    setError(null);
    setStatus('Please wait...');
    setIsLoading(true);

    // Wait for 3 seconds before initiating the translation action
    setTimeout(async () => {
      console.log('Attempting to start translation...');
      try {
        const response = await axios.post('http://localhost:5003/start-translation');
        if (response.status === 200) {
          setIsTranslating(true);
          setStatus('Translation is active');
          console.log('Translation started successfully.');
        } else {
          setStatus('Failed to start translation.');
          console.error('Failed to start translation.');
        }
      } catch (error) {
        console.error('Error starting translation:', error.response?.data || error.message);
        setError(error.response?.data || 'Error starting translation.');
        setStatus('Idle');
      } finally {
        setIsLoading(false);
      }
    }, 3000); // 3 seconds delay
  };

  return (
    <div className="translation-wrapper">
      <h1 className="translation-heading">Real-Time Translation</h1>

      <div className="button-container">
        {!isTranslating ? (
          <button
            className="start-btn"
            onClick={startTranslation}
            disabled={isLoading} // Disable button during loading
            aria-disabled={isLoading} // Accessibility attribute
          >
            {isLoading ? (
              <>
                <span className="spinner"></span> Please wait...
              </>
            ) : (
              'Start Translation'
            )}
          </button>
        ) : (
          <button
            className="start-btn" // Reusing start-btn class for consistency
            onClick={startTranslation} // Optionally, you can disable or hide this button if stopping is not needed
            disabled={isLoading}
            aria-disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span> Please wait...
              </>
            ) : (
              'Start Translation'
            )}
          </button>
        )}
      </div>

      {/* Display Status and Errors */}
      <div className="status-container">
        <p>Status: {status}</p>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default RealTimeTranslation;
