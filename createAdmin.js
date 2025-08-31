import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";
import connectDB from "./config/db.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("❌ Admin already exists!");
      process.exit(1);
    }

    // Create new admin
    const admin = new Admin({
      username: "devacademy",
      password: "dev@67676" // This will be automatically hashed
    });

    await admin.save();
    console.log("✅ Admin created successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("You can now login using these credentials");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
