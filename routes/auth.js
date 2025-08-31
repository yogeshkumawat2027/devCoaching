import express from "express";
import Student from "../models/Student.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Parent login by phone number
router.post("/login", async (req, res) => {
  try {
    const { parentPhone } = req.body;
    const student = await Student.findOne({ parentPhone });

    if (!student) {
      return res.status(404).json({ message: "No student found for this number" });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin login
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: { id: admin._id, username: admin.username, role: admin.role }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create admin (for initial setup)
router.post("/admin/create", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = new Admin({ username, password });
    await admin.save();

    res.json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error creating admin", error: err.message });
  }
});

export default router;
