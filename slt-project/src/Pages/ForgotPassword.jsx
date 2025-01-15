import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "password has been sent to your email address.");
        setErrorMessage("");
      } else {
        setErrorMessage(data.message || "Failed to send password. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Server error. Please try again later.");
    }
  };

  return (
    <>
      <header className="logo-header">
        <div className="logo-wrapper">
          /Sign<span className="half-logo">Ease</span>
        </div>
      </header>
      
      <div className="forgot-password-container">
        <div className="forgot-password-box">
          <h2>Forgot Password</h2>
          {message && <p className="message">{message}</p>}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="reset-button">Send Password</button>
          </form>

          <p className="back-to-login">
            <a onClick={() => navigate('/login')}>Back to Login</a>
          </p>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
