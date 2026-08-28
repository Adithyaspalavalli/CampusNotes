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
    if (
      req.user.role !== "master" &&
      !req.user.permissions?.approveNotes
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to approve notes",
      });
    }

    // Check subject access
    if (!hasSubjectAccess(req.user, note)) {
      return res.status(403).json({
        message:
          "You do not have access to this subject",
      });
    }

    // Only pending notes can be approved
    if (note.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Only pending notes can be approved",
      });
    }

    note.status = "APPROVED";
    note.approvedBy = req.user._id;
    note.approvedAt = new Date();
    note.rejectionReason = null;

    await note.save();

    res.json({
      message: "Note approved successfully",

      note: {
        id: note._id,
        status: note.status,
        approvedBy: note.approvedBy,
        approvedAt: note.approvedAt,
      },
    });

  } catch (error) {
    console.error(
      "Approve note error:",
      error
    );

    res.status(500).json({
      message: "Failed to approve note",
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