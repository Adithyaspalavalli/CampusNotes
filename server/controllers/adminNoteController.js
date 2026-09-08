const mongoose = require("mongoose");

const Note = require("../models/Note");


// Check whether Admin can access a note's subject
const hasSubjectAccess = (admin, note) => {
  if (admin.role === "master") {
    return true;
  }

  return admin.assignedSubjects.some(
    (subjectId) =>
      subjectId.toString() ===
      note.subject.toString()
  );
};


// Get pending notes
const getPendingNotes = async (req, res) => {
  try {
    const admin = req.user;

    if (admin.role !== "admin" && admin.role !== "master") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    // Master can see everything
    if (admin.role === "master") {
      const notes = await Note.find({
        status: "PENDING",
      })
        .populate(
          "subject",
          "name code semester"
        )
        .populate(
          "uploadedBy",
          "name email"
        )
        .sort({
          createdAt: -1,
        });

      return res.json({
        count: notes.length,
        notes,
      });
    }

    // Admin can only see assigned subjects
    const notes = await Note.find({
      status: "PENDING",
      subject: {
        $in: admin.assignedSubjects,
      },
    })
      .populate(
        "subject",
        "name code semester"
      )
      .populate(
        "uploadedBy",
        "name email"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      count: notes.length,
      notes,
    });

  } catch (error) {
    console.error(
      "Get pending notes error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch pending notes",
    });
  }
};


// Get one note for review
const getNoteForReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    const note = await Note.findById(id)
      .populate(
        "subject",
        "name code semester"
      )
      .populate(
        "uploadedBy",
        "name email"
      );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    // Check subject access for Admin
    if (!hasSubjectAccess(req.user, note)) {
      return res.status(403).json({
        message:
          "You do not have access to this subject",
      });
    }

    res.json({
      note,
    });

  } catch (error) {
    console.error(
      "Get note for review error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch note",
    });
  }
};


// Approve note
const approveNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Note ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    // Check permission
    const isMaster = req.user.role === "master";
    const canApprove =
      isMaster || req.user.permissions?.approveNotes === true;

    if (!canApprove) {
      return res.status(403).json({
        message: "You do not have permission to approve notes",
      });
    }

    // Check subject access for Admin
    if (!isMaster && !hasSubjectAccess(req.user, note)) {
      return res.status(403).json({
        message: "You do not have access to this subject",
      });
    }

    // Only pending notes can be approved
    if (note.status !== "PENDING") {
      return res.status(400).json({
        message: `Note cannot be approved because its status is ${note.status}`,
      });
    }

    // Find currently active version in this note series
    const currentVersion = await Note.findOne({
      noteSeriesId: note.noteSeriesId,
      isCurrent: true,
      _id: { $ne: note._id },
    });

    // If an older version exists, mark it outdated
    if (currentVersion) {
      currentVersion.status = "OUTDATED";
      currentVersion.isCurrent = false;

      await currentVersion.save();
    }

    // Approve the new version
    note.status = "APPROVED";
    note.isCurrent = true;

    note.approvedBy = req.user._id;
    note.approvedAt = new Date();

    // Clear rejection information
    note.rejectionReason = null;
    note.rejectedBy = null;
    note.rejectedAt = null;

    await note.save();

    return res.status(200).json({
      message: "Note approved successfully",
      note: {
        id: note._id,
        status: note.status,
        version: note.version,
        isCurrent: note.isCurrent,
        approvedBy: note.approvedBy,
        approvedAt: note.approvedAt,
      },
    });

  } catch (error) {
    console.error("APPROVE NOTE ERROR:", error);

    return res.status(500).json({
      message: "Failed to approve note",
      error: error.message,
    });
  }
};


// Reject note
const rejectNote = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      rejectionReason,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    if (!rejectionReason?.trim()) {
      return res.status(400).json({
        message:
          "Rejection reason is required",
      });
    }

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    // Check permission
    if (
      req.user.role !== "master" &&
      !req.user.permissions?.rejectNotes
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to reject notes",
      });
    }

    // Check subject access
    if (!hasSubjectAccess(req.user, note)) {
      return res.status(403).json({
        message:
          "You do not have access to this subject",
      });
    }

    // Only pending notes can be rejected
    if (note.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Only pending notes can be rejected",
      });
    }

    note.status = "REJECTED";
    note.rejectionReason =
      rejectionReason.trim();

    note.approvedBy = null;
    note.approvedAt = null;

    await note.save();

    res.json({
      message: "Note rejected successfully",

      note: {
        id: note._id,
        status: note.status,
        rejectionReason:
          note.rejectionReason,
      },
    });

  } catch (error) {
    console.error(
      "Reject note error:",
      error
    );

    res.status(500).json({
      message: "Failed to reject note",
    });
  }
};


module.exports = {
  getPendingNotes,
  getNoteForReview,
  approveNote,
  rejectNote,
};