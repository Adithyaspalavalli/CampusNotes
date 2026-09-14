const mongoose = require("mongoose");

const Note = require("../models/Note");

/*
==================================================
CHECK WHETHER ADMIN CAN ACCESS NOTE'S SUBJECT
==================================================
*/

const hasSubjectAccess = (admin, note) => {
  // Master has access to every subject.
  if (admin.role === "master") {
    return true;
  }

  // Only Admin should reach this point.
  if (admin.role !== "admin") {
    return false;
  }

  // Safely get assigned subjects.
  const assignedSubjects =
    admin.assignedSubjects || [];

  /*
  --------------------------------------------------
  IMPORTANT

  note.subject may be:

  1. ObjectId
     OR
  2. Populated subject object

  So we normalize it first.
  --------------------------------------------------
  */

  const noteSubjectId =
    note.subject?._id
      ? note.subject._id.toString()
      : note.subject?.toString();

  if (!noteSubjectId) {
    return false;
  }

  return assignedSubjects.some(
    (subjectId) =>
      subjectId.toString() ===
      noteSubjectId
  );
};


/*
==================================================
GET PENDING NOTES
GET /api/admin/notes/pending
==================================================
*/

const getPendingNotes = async (req, res) => {
  try {
    const admin = req.user;

    /*
    --------------------------------------------------
    CHECK ROLE
    --------------------------------------------------
    */

    if (
      admin.role !== "admin" &&
      admin.role !== "master"
    ) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    /*
    --------------------------------------------------
    MASTER
    --------------------------------------------------

    Master can see all pending notes.
    --------------------------------------------------
    */

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

      return res.status(200).json({
        count: notes.length,
        notes,
      });
    }

    /*
    --------------------------------------------------
    ADMIN
    --------------------------------------------------

    Admin can only see notes belonging to
    assigned subjects.
    --------------------------------------------------
    */

    const assignedSubjects =
      admin.assignedSubjects || [];

    const notes = await Note.find({
      status: "PENDING",
      subject: {
        $in: assignedSubjects,
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

    return res.status(200).json({
      count: notes.length,
      notes,
    });

  } catch (error) {
    console.error(
      "Get pending notes error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch pending notes",
    });
  }
};


/*
==================================================
GET ONE NOTE FOR REVIEW
GET /api/admin/notes/:id
==================================================
*/

const getNoteForReview = async (req, res) => {
  try {
    const { id } = req.params;

    /*
    --------------------------------------------------
    VALIDATE ID
    --------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    /*
    --------------------------------------------------
    FIND NOTE
    --------------------------------------------------
    */

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

    /*
    --------------------------------------------------
    ONLY PENDING NOTES CAN BE REVIEWED
    --------------------------------------------------
    */

    if (note.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Only pending notes can be reviewed",
      });
    }

    /*
    --------------------------------------------------
    CHECK SUBJECT ACCESS
    --------------------------------------------------
    */

    if (
      !hasSubjectAccess(
        req.user,
        note
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have access to this subject",
      });
    }

    return res.status(200).json({
      note,
    });

  } catch (error) {
    console.error(
      "Get note for review error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch note",
    });
  }
};


/*
==================================================
APPROVE NOTE
PUT /api/admin/notes/:id/approve
==================================================
*/

const approveNote = async (req, res) => {
  try {
    const { id } = req.params;

    /*
    --------------------------------------------------
    VALIDATE ID
    --------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    /*
    --------------------------------------------------
    FIND NOTE
    --------------------------------------------------
    */

    const note =
      await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    /*
    --------------------------------------------------
    ONLY PENDING NOTES CAN BE APPROVED
    --------------------------------------------------
    */

    if (note.status !== "PENDING") {
      return res.status(400).json({
        message:
          `Note cannot be approved because its status is ${note.status}`,
      });
    }

    /*
    --------------------------------------------------
    CHECK APPROVAL PERMISSION
    --------------------------------------------------
    */

    const isMaster =
      req.user.role === "master";

    const canApprove =
      isMaster ||
      (
        req.user.role === "admin" &&
        req.user.permissions?.approveNotes === true
      );

    if (!canApprove) {
      return res.status(403).json({
        message:
          "You do not have permission to approve notes",
      });
    }

    /*
    --------------------------------------------------
    CHECK SUBJECT ACCESS
    --------------------------------------------------
    */

    if (
      !hasSubjectAccess(
        req.user,
        note
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have access to this subject",
      });
    }

    /*
    --------------------------------------------------
    FIND CURRENT VERSION
    --------------------------------------------------

    If this is a new version of an existing note,
    the previous approved version will be current.

    Example:

    v1 APPROVED + CURRENT
    v2 PENDING

    Approving v2 means:

    v1 → OUTDATED
    v2 → APPROVED + CURRENT
    --------------------------------------------------
    */

    const currentVersion =
      await Note.findOne({
        noteSeriesId:
          note.noteSeriesId,

        isCurrent: true,

        _id: {
          $ne: note._id,
        },
      });

    /*
    --------------------------------------------------
    MARK OLD VERSION OUTDATED
    --------------------------------------------------
    */

    if (currentVersion) {
      currentVersion.status =
        "OUTDATED";

      currentVersion.isCurrent =
        false;

      await currentVersion.save();
    }

    /*
    --------------------------------------------------
    APPROVE NEW VERSION
    --------------------------------------------------
    */

    note.status =
      "APPROVED";

    note.isCurrent =
      true;

    note.approvedBy =
      req.user._id;

    note.approvedAt =
      new Date();

    /*
    --------------------------------------------------
    CLEAR OLD REJECTION INFORMATION
    --------------------------------------------------
    */

    note.rejectionReason =
      null;

    note.rejectedBy =
      null;

    note.rejectedAt =
      null;

    await note.save();

    /*
    --------------------------------------------------
    RESPONSE
    --------------------------------------------------
    */

    return res.status(200).json({
      message:
        "Note approved successfully",

      note: {
        id: note._id,

        status:
          note.status,

        version:
          note.version,

        isCurrent:
          note.isCurrent,

        approvedBy:
          note.approvedBy,

        approvedAt:
          note.approvedAt,
      },
    });

  } catch (error) {
    console.error(
      "APPROVE NOTE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to approve note",
    });
  }
};


/*
==================================================
REJECT NOTE
PUT /api/admin/notes/:id/reject
==================================================
*/

const rejectNote = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      rejectionReason,
    } = req.body;

    /*
    --------------------------------------------------
    VALIDATE ID
    --------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    /*
    --------------------------------------------------
    VALIDATE REJECTION REASON
    --------------------------------------------------
    */

    if (
      !rejectionReason ||
      !rejectionReason.trim()
    ) {
      return res.status(400).json({
        message:
          "Rejection reason is required",
      });
    }

    /*
    --------------------------------------------------
    LIMIT REJECTION REASON
    --------------------------------------------------
    */

    if (
      rejectionReason.trim().length > 500
    ) {
      return res.status(400).json({
        message:
          "Rejection reason cannot exceed 500 characters",
      });
    }

    /*
    --------------------------------------------------
    FIND NOTE
    --------------------------------------------------
    */

    const note =
      await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    /*
    --------------------------------------------------
    ONLY PENDING NOTES CAN BE REJECTED
    --------------------------------------------------
    */

    if (note.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Only pending notes can be rejected",
      });
    }

    /*
    --------------------------------------------------
    CHECK REJECTION PERMISSION
    --------------------------------------------------
    */

    const isMaster =
      req.user.role === "master";

    const canReject =
      isMaster ||
      (
        req.user.role === "admin" &&
        req.user.permissions?.rejectNotes === true
      );

    if (!canReject) {
      return res.status(403).json({
        message:
          "You do not have permission to reject notes",
      });
    }

    /*
    --------------------------------------------------
    CHECK SUBJECT ACCESS
    --------------------------------------------------
    */

    if (
      !hasSubjectAccess(
        req.user,
        note
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have access to this subject",
      });
    }

    /*
    --------------------------------------------------
    REJECT NOTE
    --------------------------------------------------
    */

    note.status =
      "REJECTED";

    note.isCurrent =
      false;

    note.rejectionReason =
      rejectionReason.trim();

    /*
    --------------------------------------------------
    CLEAR APPROVAL INFORMATION
    --------------------------------------------------
    */

    note.approvedBy =
      null;

    note.approvedAt =
      null;

    /*
    --------------------------------------------------
    STORE REJECTION INFORMATION
    --------------------------------------------------
    */

    note.rejectedBy =
      req.user._id;

    note.rejectedAt =
      new Date();

    await note.save();

    /*
    --------------------------------------------------
    RESPONSE
    --------------------------------------------------
    */

    return res.status(200).json({
      message:
        "Note rejected successfully",

      note: {
        id: note._id,

        status:
          note.status,

        isCurrent:
          note.isCurrent,

        rejectionReason:
          note.rejectionReason,

        rejectedBy:
          note.rejectedBy,

        rejectedAt:
          note.rejectedAt,
      },
    });

  } catch (error) {
    console.error(
      "Reject note error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to reject note",
    });
  }
};


const getManageNotes = async (req, res) => {
  try {
    const admin = req.user;

    if (
      admin.role !== "admin" &&
      admin.role !== "master"
    ) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    let query = {};

    // Master can see every note
    if (admin.role === "master") {
      query = {};
    } else {
      // Admin can see only notes
      // belonging to assigned subjects
      query = {
        subject: {
          $in: admin.assignedSubjects || [],
        },
      };
    }

    const notes = await Note.find(query)
      .populate(
        "subject",
        "name code semester"
      )
      .populate(
        "uploadedBy",
        "name email"
      )
      .populate(
        "approvedBy",
        "name email"
      )
      .populate(
        "rejectedBy",
        "name email"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error(
      "Get manage notes error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch notes",
    });
  }
};


/*
==================================================
EXPORT
==================================================
*/

module.exports = {
  getPendingNotes,
  getNoteForReview,
  approveNote,
  rejectNote,
  getManageNotes,
};