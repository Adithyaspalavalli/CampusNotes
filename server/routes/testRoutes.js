const express = require("express");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminmiddleware");

const router = express.Router();

// Any logged-in user
router.get("/student", protect, (req, res) => {
  res.json({
    message: "You are logged in!",
    user: req.user,
  });
});

// Admin only
router.get("/admin", protect, adminOnly, (req, res) => {
  res.json({
    message: "Welcome Admin!",
    user: req.user,
  });
});

module.exports = router;