
const express = require("express");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminmiddleware");

const {
  getAdminDashboardStats,
} = require("../controllers/adminDashboardController");

const {
  getAnalytics,
  exportAnalyticsCsv,
} = require("../controllers/analyticsController");

const router = express.Router();

// Existing dashboard statistics
router.get(
  "/stats",
  protect,
  adminOnly,
  getAdminDashboardStats
);

// Phase 1 analytics
router.get(
  "/analytics",
  protect,
  adminOnly,
  getAnalytics
);

// Export analytics as CSV
router.get(
  "/analytics/export",
  protect,
  adminOnly,
  exportAnalyticsCsv
);

module.exports = router;
