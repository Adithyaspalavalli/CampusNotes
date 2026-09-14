const Note = require("../models/Note");

const getAdminDashboardStats = async (req, res) => {
  try {
    const user = req.user;

    // Only Admin and Master can access this endpoint
    if (user.role !== "admin" && user.role !== "master") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    // Admin must have statistics permission
    if (
      user.role === "admin" &&
      user.permissions?.viewStatistics !== true
    ) {
      return res.status(403).json({
        message: "You do not have permission to view statistics",
      });
    }

    // Master sees everything
    // Admin sees only notes from assigned subjects
    let noteQuery = {};

    if (user.role === "admin") {
      noteQuery = {
        subject: {
          $in: user.assignedSubjects || [],
        },
      };
    }

    const [
      totalNotes,
      approvedNotes,
      currentApprovedNotes,
      pendingNotes,
      rejectedNotes,
      outdatedNotes,
    ] = await Promise.all([
      Note.countDocuments(noteQuery),

      Note.countDocuments({
        ...noteQuery,
        status: "APPROVED",
      }),

      Note.countDocuments({
        ...noteQuery,
        status: "APPROVED",
        isCurrent: true,
      }),

      Note.countDocuments({
        ...noteQuery,
        status: "PENDING",
      }),

      Note.countDocuments({
        ...noteQuery,
        status: "REJECTED",
      }),

      Note.countDocuments({
        ...noteQuery,
        status: "OUTDATED",
      }),
    ]);

    // Calculate downloads only from current approved notes
    const totalDownloadsResult = await Note.aggregate([
      {
        $match: {
          ...noteQuery,
          status: "APPROVED",
          isCurrent: true,
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
    ]);

    const totalDownloads =
      totalDownloadsResult[0]?.total || 0;

    return res.status(200).json({
      statistics: {
        totalNotes,
        approvedNotes,
        currentApprovedNotes,
        pendingNotes,
        rejectedNotes,
        outdatedNotes,
        totalDownloads,
      },
    });
  } catch (error) {
    console.error(
      "Get admin dashboard stats error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch admin statistics",
    });
  }
};

module.exports = {
  getAdminDashboardStats,
};