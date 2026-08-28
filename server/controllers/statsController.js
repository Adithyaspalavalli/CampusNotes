const User = require("../models/User");
const Note = require("../models/Note");

const getMasterStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalAdmins,
      totalNotes,
      pendingNotes,
      approvedNotes,
      rejectedNotes,
      totalDownloads,
    ] = await Promise.all([
      User.countDocuments({
        role: "student",
      }),

      User.countDocuments({
        role: "admin",
      }),

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

      Note.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$downloadCount",
            },
          },
        },
      ]),
    ]);

    res.json({
      totalStudents,
      totalAdmins,
      totalNotes,
      pendingNotes,
      approvedNotes,
      rejectedNotes,
      totalDownloads:
        totalDownloads[0]?.total || 0,
    });
  } catch (error) {
    console.error(
      "Master stats error:",
      error
    );

    res.status(500).json({
      message: "Failed to load statistics",
    });
  }
};

//admin controllers
const getAdminStats = async (req, res) => {
  try {
    const admin = req.user;

    if (admin.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    if (!admin.permissions?.viewStatistics) {
      return res.status(403).json({
        message: "Statistics permission denied.",
      });
    }

    const subjectIds = admin.assignedSubjects || [];

    const [
      totalNotes,
      pendingNotes,
      approvedNotes,
      rejectedNotes,
      downloads,
    ] = await Promise.all([
      Note.countDocuments({
        subject: { $in: subjectIds },
      }),

      Note.countDocuments({
        subject: { $in: subjectIds },
        status: "PENDING",
      }),

      Note.countDocuments({
        subject: { $in: subjectIds },
        status: "APPROVED",
      }),

      Note.countDocuments({
        subject: { $in: subjectIds },
        status: "REJECTED",
      }),

      Note.aggregate([
        {
          $match: {
            subject: {
              $in: subjectIds,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$downloadCount",
            },
          },
        },
      ]),
    ]);

    res.json({
      subjectsManaged: subjectIds.length,

      totalNotes,
      pendingNotes,
      approvedNotes,
      rejectedNotes,

      totalDownloads:
        downloads[0]?.total || 0,
    });
  } catch (error) {
    console.error(
      "Admin stats error:",
      error
    );

    res.status(500).json({
      message: "Failed to load statistics",
    });
  }
};

module.exports = {
  getMasterStats,
   getAdminStats,
};