const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const connectDB = require("./config/db");
const PORT = 5000;

connectDB(); // Connect to MongoDB

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "CampusNotes API is running successfully",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});