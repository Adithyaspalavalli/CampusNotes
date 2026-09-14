const User = require("../models/User");
const Note = require("../models/Note");
const Subject = require("../models/Subject");

const getMasterDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== "master") {
      return res.status(403).json({
        message: "Master access required",
      });
    }

    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalMasters,
      activeUsers,
      disabledUsers,

      totalNotes,
      pendingNotes,
      approvedNotes,
      rejectedNotes,
      outdatedNotes,

      totalSubjects,
      activeSubjects,
      inactiveSubjects,
    ] = await Promise.all([
      // USERS
      User.countDocuments(),

      User.countDocuments({
        role: "student",
      }),

      User.countDocuments({
        role: "admin",
      }),

      User.countDocuments({
        role: "master",
      }),

      User.countDocuments({
        isActive: true,
      }),

      User.countDocuments({
        isActive: false,
      }),

      // NOTES
      Note.countDocuments(),

      Note.countDocuments({
        status: "PENDING",
      }),

      Note.countDocuments({
        status: "APPROVED",
      }),

      Note.countDocuments({
        status: "REJECTED",
      }),

      Note.countDocuments({
        status: "OUTDATED",
      }),

      // SUBJECTS
      Subject.countDocuments(),

      Subject.countDocuments({
        isActive: true,
      }),

      Subject.countDocuments({
        isActive: false,
      }),
    ]);

    return res.status(200).json({
      users: {
        total: totalUsers,
        students: totalStudents,
        admins: totalAdmins,
        masters: totalMasters,
        active: activeUsers,
        disabled: disabledUsers,
      },

      notes: {
        total: totalNotes,
        pending: pendingNotes,
        approved: approvedNotes,
        rejected: rejectedNotes,
        outdated: outdatedNotes,
      },

      subjects: {
        total: totalSubjects,
        active: activeSubjects,
        inactive: inactiveSubjects,
      },
    });
  } catch (error) {
    console.error(
      "Get master dashboard stats error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch dashboard statistics",
    });
  }
};

module.exports = {
  getMasterDashboardStats,
};