import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";
import { Link } from "react-router-dom";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // State to handle error messages
  const navigate = useNavigate(); // React Router's useNavigate hook

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear any error messages
        setErrorMessage("");
        // Store the JWT token
        localStorage.setItem("token", data.token);
        // Redirect to Home page on successful login
        navigate("/home");
      } else {
        // Set error message if login fails
        setErrorMessage(data.message || "Either email is not registered or incorrect password");
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

      <div className="signin-container">
        {/* Left Section - Image */}
        <div className="left-signin-section">
          <img
            src="/Deaf_Talking-removebg-preview.png"
            alt="Sign Language Communication"
          />

          {/* New Text Below the Image */}
          <div className="text-container">
            <p className="main-text">Unlock Communication & Enjoy</p>
            <p className="highlighted-text">
              the best experience with SignEase
            </p>
            <p className="sub-text">Made for TBI Survivors</p>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="right-signin-section">
          <div className="signin-form-container">
            <h2>Log in</h2>

            {/* Display the error message if it exists */}
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

              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="forgot-password">
                <Link to="/forgot-password">Forgot your password?</Link>
              </div>

              <button type="submit" className="login-button">
                Log in
              </button>
            </form>

            <p className="signup-option">
              Need to create an account? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignIn;
