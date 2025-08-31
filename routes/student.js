import express from "express";
import Student from "../models/Student.js";

const router = express.Router();

// ✅ Add Student
router.post("/add", async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    await newStudent.save();
    res.json(newStudent);
  } catch (err) {
    res.status(500).json({ message: "Error adding student", error: err.message });
  }
});

// ✅ Get All Students (filter by batch if needed)
router.get("/", async (req, res) => {
  try {
    const { batch } = req.query; // e.g., ?batch=Navodaya
    const query = batch ? { batch } : {};
    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students" });
  }
});

// ✅ Add Result by Roll No
router.post("/:rollNo/addResult", async (req, res) => {
  try {
    const student = await Student.findOne({ rollNo: req.params.rollNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.results.push(req.body); // examName, subject, marksObtained, totalMarks
    await student.save();

    res.json({ message: "Result added", student });
  } catch (err) {
    res.status(500).json({ message: "Error adding result", error: err.message });
  }
});

// ✅ Get Results by Roll No
router.get("/:rollNo/results", async (req, res) => {
  try {
    const student = await Student.findOne({ rollNo: req.params.rollNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student.results);
  } catch (err) {
    res.status(500).json({ message: "Error fetching results" });
  }
});

export default router;
