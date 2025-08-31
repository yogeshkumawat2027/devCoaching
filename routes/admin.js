import express from "express";
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

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

// Upload student image (admin only)
router.post("/student/:rollNo/upload-image", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const student = await Student.findOne({ rollNo: req.params.rollNo });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

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

    res.json({ 
      message: "Image uploaded successfully", 
      imageUrl: result.secure_url, 
      student: student.name 
    });
  } catch (err) {
    res.status(500).json({ message: "Error uploading image", error: err.message });
  }
});

// Get all students (admin only)
router.get("/students", verifyAdmin, async (req, res) => {
  try {
    const { batch, parentPhone } = req.query;
    let query = {};
    
    if (batch) {
      query.batch = batch;
    }
    
    if (parentPhone) {
      query.parentPhone = parentPhone;
    }
    
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

// Add bulk student results (admin only)
router.post("/bulk-results", verifyAdmin, async (req, res) => {
  try {
    const { batch, examName, subject, totalMarks, examDate, studentResults } = req.body;

    const results = [];
    const errors = [];

    // Process each student result
    for (const studentResult of studentResults) {
      try {
        const { rollNo, marksObtained } = studentResult;

        // Find student by roll number and batch
        const student = await Student.findOne({ rollNo, batch });
        if (!student) {
          errors.push({
            rollNo,
            error: `Student with roll number ${rollNo} not found in ${batch} batch`
          });
          continue;
        }

        // Create result object
        const result = {
          examName,
          subject,
          marksObtained: parseInt(marksObtained),
          totalMarks: parseInt(totalMarks),
          date: examDate ? new Date(examDate) : new Date()
        };

        // Add result to student
        student.results.push(result);
        await student.save();

        results.push({
          rollNo,
          studentName: student.name,
          marksObtained,
          percentage: Math.round((marksObtained / totalMarks) * 100)
        });

      } catch (error) {
        errors.push({
          rollNo: studentResult.rollNo,
          error: error.message
        });
      }
    }

    res.json({
      message: `Bulk results processed: ${results.length} successful, ${errors.length} failed`,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors
    });

  } catch (err) {
    res.status(500).json({ message: "Error processing bulk results", error: err.message });
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
    const { parentPhone } = req.body;

    // Check if parent phone number is already registered
    const existingStudent = await Student.findOne({ parentPhone });
    if (existingStudent) {
      return res.status(400).json({ 
        message: `This parent phone number is already registered with student: ${existingStudent.name} (Roll No: ${existingStudent.rollNo})`,
        duplicateStudent: {
          name: existingStudent.name,
          rollNo: existingStudent.rollNo,
          class: existingStudent.class
        }
      });
    }

    const newStudent = new Student(req.body);
    await newStudent.save();
    res.json({ message: "Student added successfully", student: newStudent });
  } catch (err) {
    res.status(500).json({ message: "Error adding student", error: err.message });
  }
});

// Upload student image (admin only)
router.post("/student/:rollNo/upload-image", verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { rollNo } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Find student
    const student = await Student.findOne({ rollNo: parseInt(rollNo) });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'students',
      public_id: `student_${rollNo}`,
      overwrite: true
    });

    // Update student with image URL
    student.imageUrl = result.secure_url;
    await student.save();

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    res.json({ 
      message: "Image uploaded successfully", 
      imageUrl: result.secure_url 
    });

  } catch (err) {
    // Clean up file if exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error("Error deleting temp file:", unlinkErr);
      }
    }
    res.status(500).json({ message: "Error uploading image", error: err.message });
  }
});

export default router;
