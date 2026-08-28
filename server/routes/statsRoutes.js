const express = require("express");

const protect = require("../middleware/authMiddleware");
const masterOnly = require("../middleware/masterMiddleware");
const adminOnly = require("../middleware/adminmiddleware");

const {
  getMasterStats,
  getAdminStats,
} = require("../controllers/statsController");

const router = express.Router();

// Master statistics
router.get(
  "/master",
  protect,
  masterOnly,
  getMasterStats
);

// Admin statistics
router.get(
  "/admin",
  protect,
  adminOnly,
  getAdminStats
);

module.exports = router;