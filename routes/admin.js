import express from "express";
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ message: "No token, access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Get all students (admin only)
router.get("/students", verifyAdmin, async (req, res) => {
  try {
    const { batch } = req.query;
    const query = batch ? { batch } : {};
    const students = await Student.find(query).select("-__v");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students" });
  }
});

// Add student result by roll number (admin only)
router.post("/student/:rollNo/result", verifyAdmin, async (req, res) => {
  try {
    const { rollNo } = req.params;
    const { examName, subject, marksObtained, totalMarks } = req.body;

    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const result = {
      examName,
      subject,
      marksObtained,
      totalMarks,
      date: new Date()
    };

    student.results.push(result);
    await student.save();

    res.json({ 
      message: "Result added successfully", 
      student: student.name,
      result 
    });
  } catch (err) {
    res.status(500).json({ message: "Error adding result", error: err.message });
  }
});

// Update student fees (admin only)
router.put("/student/:rollNo/fees", verifyAdmin, async (req, res) => {
  try {
    const { rollNo } = req.params;
    const { feesPaid } = req.body;

    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.feesPaid = feesPaid;
    await student.save();

    res.json({ 
      message: "Fees updated successfully", 
      student: student.name,
      feesPaid,
      feesTotal: student.feesTotal
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating fees", error: err.message });
  }
});

// Add new student (admin only)
router.post("/student/add", verifyAdmin, async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    await newStudent.save();
    res.json({ message: "Student added successfully", student: newStudent });
  } catch (err) {
    res.status(500).json({ message: "Error adding student", error: err.message });
  }
});

export default router;
