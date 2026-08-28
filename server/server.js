const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

require("./models/Subject");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const masterRoutes = require("./routes/masterRoutes");
const statsRoutes = require("./routes/statsRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const noteRoutes = require("./routes/noteRoutes");
const adminNoteRoutes = require("./routes/adminNoteRoutes");
const testRoutes = require("./routes/testRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/stats", statsRoutes);
app.use(
  "/api/password",
  passwordRoutes
);
app.use(
  "/api/notes",
  noteRoutes
);
app.use(
  "/api/admin/notes",
  adminNoteRoutes
);
app.use("/api/test", testRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  // Multer errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      message: `Upload error: ${err.message}`,
    });
  }

  // Mongoose invalid ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID provided",
    });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Invalid data provided",
      errors: Object.values(err.errors).map(
        (error) => error.message
      ),
    });
  }

  // File validation or other custom errors
  if (err.message) {
    return res.status(400).json({
      message: err.message,
    });
  }

  // Unknown error
  res.status(500).json({
    message: "Internal server error",
  });
});

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "CampusNotes API is running",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});