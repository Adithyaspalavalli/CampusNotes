const express = require("express");

const protect = require("../middleware/authMiddleware");
const masterOnly = require("../middleware/masterMiddleware");

const {
  getMasterDashboardStats,
} = require("../controllers/masterDashboardController");

const {
  getAllUsers,
  changeUserRole,
  toggleUserStatus,
} = require("../controllers/masterUserController");

const {
  getAllSubjects,
  createSubject,
  updateSubject,
  toggleSubjectStatus,
} = require("../controllers/subjectController");

const {
  getAdmins,
  createAdmin,
  updateAdminPermissions,
  updateAdminSubjects,
  toggleAdminStatus,
    deleteAdmin,
} = require("../controllers/masterController");

const router = express.Router();

// Master dashboard
router.get(
  "/dashboard",
  protect,
  masterOnly,
  (req, res) => {
    res.json({
      message: "Welcome to the Master Dashboard",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);

router.get(
  "/dashboard/stats",
  protect,
  masterOnly,
  getMasterDashboardStats
);

// Assign subjects to Admin
router.put(
  "/admins/:id/subjects",
  protect,
  masterOnly,
  updateAdminSubjects
);

// Get all admins
router.get(
  "/admins",
  protect,
  masterOnly,
  getAdmins
);

// Create admin
router.post(
  "/admins",
  protect,
  masterOnly,
  createAdmin,
  
);

// Update Admin permissions
router.put(
  "/admins/:id/permissions",
  protect,
  masterOnly,
  updateAdminPermissions,
  
);

router.put(
  "/admins/:id/toggle-status",
  protect,
  masterOnly,
  toggleAdminStatus
);

router.delete(
  "/admins/:id",
  protect,
  masterOnly,
  deleteAdmin
);

// Subject management

// Get all subjects
router.get(
  "/subjects",
  protect,
  masterOnly,
  getAllSubjects
);

// Create subject
router.post(
  "/subjects",
  protect,
  masterOnly,
  createSubject
);

// Edit subject
router.put(
  "/subjects/:id",
  protect,
  masterOnly,
  updateSubject
);

// Enable / disable subject
router.put(
  "/subjects/:id/toggle-status",
  protect,
  masterOnly,
  toggleSubjectStatus
);

// =====================================================
// USER MANAGEMENT
// =====================================================

// Get all users
router.get(
  "/users",
  protect,
  masterOnly,
  getAllUsers
);

// Change user role
router.put(
  "/users/:id/role",
  protect,
  masterOnly,
  changeUserRole
);

// Enable / disable user
router.put(
  "/users/:id/toggle-status",
  protect,
  masterOnly,
  toggleUserStatus
);

module.exports = router;