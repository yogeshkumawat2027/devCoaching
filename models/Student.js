import mongoose from "mongoose";

// Result Schema
const resultSchema = new mongoose.Schema({
  examName: { type: String, required: true },
  subject: { type: String, required: true },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

// Student Schema
const studentSchema = new mongoose.Schema({
  rollNo: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  dob: String,
  class: { type: String, required: true },

  batch: {
    type: String,
    enum: ["Navodaya", "Sainik", "DevEducationYojana"],
    required: true
  },

  parentPhone: { type: String, required: true },
  imageUrl: String,

  feesTotal: { type: Number, required: true },
  feesPaid: { type: Number, default: 0 },

  results: [resultSchema],

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Student", studentSchema);
