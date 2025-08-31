
import express from "express";
import Student from "../models/Student.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import fs from "fs";


const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.post("/:rollNo/upload-image", upload.single("image"), async (req, res) => {
  try {
    const student = await Student.findOne({ rollNo: req.params.rollNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const imagePath = req.file.path;
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "students",
      public_id: `student_${student.rollNo}`,
      overwrite: true
    });

    // Remove local file after upload
    fs.unlinkSync(imagePath);

    student.imageUrl = result.secure_url;
    await student.save();

    res.json({ message: "Image uploaded", imageUrl: result.secure_url, student });
  } catch (err) {
    res.status(500).json({ message: "Error uploading image", error: err.message });
  }
});

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

// ✅ Get Student by Parent Phone Number
router.get("/by-phone/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    
    // Find student by parent phone number
    const student = await Student.findOne({ 
      $or: [
        { parentPhone: phone },
        { phone: phone } // In case phone is stored in 'phone' field
      ]
    });
    
    if (!student) {
      return res.status(404).json({ message: "No student found with this phone number" });
    }

    // Return complete student data including results
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Error fetching student data", error: err.message });
  }
});

export default router;
