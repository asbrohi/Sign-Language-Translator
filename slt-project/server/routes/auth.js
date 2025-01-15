// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();

// Sign Up Route
// Sign Up Route
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const user = new User({
      firstName,
      lastName,
      email,
      password, // Store password in plain text
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// Sign In Route
// Sign In Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ 
      message: setMessage(""),
      message: "Email not registered" });

    // Set up nodemailer to send the email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL,
      subject: "Your Password",
      text: `Here is your password: ${user.password}`,
    };

    transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        console.error("Error in transporter.sendMail:", err); // Log the error details
        return res
          .status(500)
          .json({ message: "Failed to send email", error: err.message });
      }
      res.json({
        message: setMessage(""),
        message: "Password has been sent to your email" });
    });
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
