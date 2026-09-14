const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const createMaster = async () => {
  try {
    // Check MongoDB connection string
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is missing in .env");
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB.");

    // Check whether a Master already exists
    const existingMaster = await User.findOne({
      role: "master",
    });

    if (existingMaster) {
      console.log(
        `Master already exists: ${existingMaster.email}`
      );

      await mongoose.connection.close();
      process.exit(0);
    }

    // Master login credentials
    const name = "CampusNotes Master";
    const email = "master@test.com";
    const password = "Master@12345";

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create Master
    const master = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "master",
      isActive: true,
    });

    console.log("\nMaster created successfully!");
    console.log("--------------------------------");
    console.log("Name:", master.name);
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Role:", master.role);
    console.log("--------------------------------\n");

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("Failed to create Master:");
    console.error(error);

    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore connection close errors
    }

    process.exit(1);
  }
};

createMaster();
