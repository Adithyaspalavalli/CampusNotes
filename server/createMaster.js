const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/User");

dotenv.config();

const createMaster = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const existingMaster = await User.findOne({
      role: "master",
    });

    if (existingMaster) {
      console.log("Master account already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      "Master@123",
      10
    );

    await User.create({
      name: "CampusNotes Master",
      email: "master@campusnotes.com",
      password: hashedPassword,
      role: "master",
      isActive: true,

      permissions: {
        approveNotes: true,
        rejectNotes: true,
        deleteNotes: true,
        editContent: true,
        manageSubjects: true,
        disableUsers: true,
        viewStatistics: true,
      },

      assignedSubjects: [],
    });

    console.log("Master account created successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error creating master:", error);
    process.exit(1);
  }
};

createMaster();