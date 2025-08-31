import express from "express";
import Student from "../models/Student.js";

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

export default router;
