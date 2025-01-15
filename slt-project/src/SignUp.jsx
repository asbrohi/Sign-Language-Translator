import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear any error messages
        setErrorMessage("");
        // Set success message and redirect to login
        setSuccessMessage("Account created successfully!");
        setTimeout(() => navigate("/login"), 2000); // Redirect after 2 seconds
      } else {
        setErrorMessage(data.message || "Sign up failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Server error. Please try again later.");
    }
  };

  return (
    <>
      <div className="wrapper">
        <header className="logo-header">
          <div className="logo-wrapper">
            /Sign<span className="half-logo">Ease</span>
          </div>
        </header>

        <div className="signup-container">
          {/* SignUp Form */}
          <div className="signup-form-container">
            <h2>Create Your Account</h2>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <form onSubmit={handleSubmit}>
              <label htmlFor="firstName">First Name</label>
              <input type="text" id="firstName" name="firstName" required onChange={handleChange} />

              <label htmlFor="lastName">Last Name</label>
              <input type="text" id="lastName" name="lastName" required onChange={handleChange} />

              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" required onChange={handleChange} />

              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" required onChange={handleChange} />

              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                onChange={handleChange}
              />

              <button type="submit" className="signup-button">
                Sign Up
              </button>
            </form>

            <p className="login-option">
              Already have an account? <a href="/login">Log in</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;
