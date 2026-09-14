const express = require("express");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminmiddleware");

const {
  getAdminDashboardStats,
} = require("../controllers/adminDashboardController");

const router = express.Router();

router.get(
  "/stats",
  protect,
  adminOnly,
  getAdminDashboardStats
);

module.exports = router;