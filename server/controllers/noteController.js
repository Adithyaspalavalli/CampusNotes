const mongoose = require("mongoose");
const fs = require("fs");

const Note = require("../models/Note");
const Subject = require("../models/Subject");

/*
==================================================
GET ALL APPROVED CURRENT NOTES
GET /api/notes
==================================================
*/

const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      status: "APPROVED",
      isCurrent: true,
    })
      .populate("subject", "name code semester")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error("Get notes error:", error);

    return res.status(500).json({
      message: "Failed to fetch notes",
    });
  }
};

/*
==================================================
GET CURRENT USER'S NOTES
GET /api/notes/my
==================================================
*/

const getMyNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      uploadedBy: req.user._id,
    })
      .populate("subject", "name code semester")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error("Get my notes error:", error);

    return res.status(500).json({
      message: "Failed to fetch your notes",
    });
  }
};

/*
==================================================
DELETE NOTE
DELETE /api/notes/:id
==================================================
*/

const deleteMyNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    // Find note
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    /*
    -----------------------------------------------
    MASTER
    -----------------------------------------------
    Master can delete any note.
    */

    if (req.user.role === "master") {
      // Master is allowed
    }

    /*
    -----------------------------------------------
    NON-MASTER USERS
    -----------------------------------------------
    Students can delete only their own notes.

    Admins can currently delete only their own notes
    through this endpoint.

    Admin deletion of other users' notes will be
    handled later through the Admin permission system.
    */

    else {
      if (
        note.uploadedBy.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "You can only delete your own notes",
        });
      }
    }

    /*
    -----------------------------------------------
    DELETE PDF FILE
    -----------------------------------------------
    */

    if (
      note.fileUrl &&
      fs.existsSync(note.fileUrl)
    ) {
      fs.unlinkSync(note.fileUrl);
    }

    /*
    -----------------------------------------------
    DELETE DATABASE RECORD
    -----------------------------------------------
    */

    await Note.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);

    return res.status(500).json({
      message: "Failed to delete note",
    });
  }
};

/*
==================================================
GET SINGLE APPROVED CURRENT NOTE
GET /api/notes/:id
==================================================
*/

const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    const note = await Note.findOne({
      _id: id,
      status: "APPROVED",
      isCurrent: true,
    })
      .populate("subject", "name code semester")
      .populate("uploadedBy", "name email");

    if (!note) {
      return res.status(404).json({
        message:
          "Note not found or is no longer available",
      });
    }

    return res.status(200).json({
      note,
    });
  } catch (error) {
    console.error("Get note by ID error:", error);

    return res.status(500).json({
      message: "Failed to fetch note",
    });
  }
};

/*
==================================================
READ APPROVED CURRENT NOTE
GET /api/notes/:id/read

Used by the student React-PDF viewer.
Does NOT increase download count.
==================================================
*/

const readNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    // Only approved/current notes can be read
    const note = await Note.findOne({
      _id: id,
      status: "APPROVED",
      isCurrent: true,
    });

    if (!note) {
      return res.status(404).json({
        message:
          "Note not found or is no longer available",
      });
    }

    // Check PDF file
    if (
      !note.fileUrl ||
      !fs.existsSync(note.fileUrl)
    ) {
      return res.status(404).json({
        message: "PDF file not found",
      });
    }

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${note.fileName}"`
    );

    const fileStream = fs.createReadStream(
      note.fileUrl
    );

    fileStream.on("error", (error) => {
      console.error(
        "PDF read stream error:",
        error
      );

      if (!res.headersSent) {
        res.status(500).json({
          message: "Failed to read PDF",
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("Read note error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Failed to read note",
      });
    }
  }
};

/*
==================================================
DOWNLOAD APPROVED CURRENT NOTE
GET /api/notes/:id/download

Increases downloadCount by 1.
==================================================
*/

const downloadNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    // Only approved/current notes can be downloaded
    const note = await Note.findOne({
      _id: id,
      status: "APPROVED",
      isCurrent: true,
    });

    if (!note) {
      return res.status(404).json({
        message:
          "Note not found or is no longer available",
      });
    }

    // Check PDF file
    if (
      !note.fileUrl ||
      !fs.existsSync(note.fileUrl)
    ) {
      return res.status(404).json({
        message: "PDF file not found",
      });
    }

    /*
    -----------------------------------------------
    INCREASE DOWNLOAD COUNT
    -----------------------------------------------
    */

    note.downloadCount += 1;

    await note.save();

    /*
    -----------------------------------------------
    SEND FILE
    -----------------------------------------------
    */

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${note.fileName}"`
    );

    const fileStream = fs.createReadStream(
      note.fileUrl
    );

    fileStream.on("error", (error) => {
      console.error(
        "PDF download stream error:",
        error
      );

      if (!res.headersSent) {
        res.status(500).json({
          message: "Failed to download PDF",
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error(
      "Download note error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Failed to download note",
      });
    }
  }
};

/*
==================================================
CREATE NEW NOTE
POST /api/notes
==================================================
*/

const createNote = async (req, res) => {
  try {
    const {
      title,
      description,
      semester,
      subject,
      unit,
      topic,
    } = req.body;

    /*
    -----------------------------------------------
    CHECK FILE
    -----------------------------------------------
    */

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF file",
      });
    }

    /*
    -----------------------------------------------
    REQUIRED FIELDS
    -----------------------------------------------
    */

    if (
      !title ||
      !semester ||
      !subject ||
      !unit ||
      !topic
    ) {
      fs.unlink(req.file.path, () => {});

      return res.status(400).json({
        message:
          "Title, semester, subject, unit and topic are required",
      });
    }

    /*
    -----------------------------------------------
    VALIDATE SUBJECT ID
    -----------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(subject)
    ) {
      fs.unlink(req.file.path, () => {});

      return res.status(400).json({
        message: "Invalid subject ID",
      });
    }

    /*
    -----------------------------------------------
    CHECK ACTIVE SUBJECT
    -----------------------------------------------
    */

    const subjectExists =
      await Subject.findOne({
        _id: subject,
        isActive: true,
      });

    if (!subjectExists) {
      fs.unlink(req.file.path, () => {});

      return res.status(400).json({
        message: "Invalid or inactive subject",
      });
    }

    /*
    -----------------------------------------------
    CHECK SEMESTER MATCH
    -----------------------------------------------
    */

    if (
      Number(semester) !==
      subjectExists.semester
    ) {
      fs.unlink(req.file.path, () => {});

      return res.status(400).json({
        message:
          "Selected semester does not match the subject",
      });
    }

    /*
    -----------------------------------------------
    CREATE NOTE SERIES
    -----------------------------------------------
    */

    const noteSeriesId =
      new mongoose.Types.ObjectId();

    /*
    -----------------------------------------------
    CREATE FIRST VERSION
    -----------------------------------------------
    */

    const note = await Note.create({
      title,
      description,

      semester: Number(semester),
      subject,

      unit: Number(unit),
      topic,

      fileUrl: req.file.path,
      fileName: req.file.originalname,

      uploadedBy: req.user._id,

      // Version information
      noteSeriesId,
      version: 1,
      previousVersion: null,

      // First version is pending
      isCurrent: false,
      status: "PENDING",

      downloadCount: 0,
    });

    return res.status(201).json({
      message:
        "Note uploaded successfully and is waiting for approval",

      note,
    });
  } catch (error) {
    console.error(
      "Create note error:",
      error
    );

    /*
    -----------------------------------------------
    DELETE UPLOADED FILE IF DB OPERATION FAILS
    -----------------------------------------------
    */

    if (req.file?.path) {
      fs.unlink(
        req.file.path,
        (unlinkError) => {
          if (unlinkError) {
            console.error(
              "Failed to delete uploaded file:",
              unlinkError
            );
          }
        }
      );
    }

    return res.status(500).json({
      message: "Failed to upload note",
    });
  }
};

/*
==================================================
CREATE NEW NOTE VERSION
POST /api/notes/:id/version
==================================================

Flow:

Approved v1
     ↓
Upload update
     ↓
Pending v2
     ↓
Admin approves
     ↓
v1 = OUTDATED
v2 = APPROVED + CURRENT
==================================================
*/

const createNoteVersion = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    /*
    -----------------------------------------------
    VALIDATE NOTE ID
    -----------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    /*
    -----------------------------------------------
    FILE REQUIRED
    -----------------------------------------------
    */

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF file",
      });
    }

    /*
    -----------------------------------------------
    FIND BASE NOTE
    -----------------------------------------------
    */

    const baseNote =
      await Note.findById(id);

    if (!baseNote) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }

      return res.status(404).json({
        message: "Note not found",
      });
    }

    /*
    -----------------------------------------------
    ONLY CURRENT APPROVED VERSION CAN BE UPDATED
    -----------------------------------------------
    */

    if (
      baseNote.status !== "APPROVED" ||
      !baseNote.isCurrent
    ) {
      fs.unlink(
        req.file.path,
        () => {}
      );

      return res.status(400).json({
        message:
          "Only the current approved version can be updated",
      });
    }

    /*
    -----------------------------------------------
    CHECK EDIT PERMISSION
    -----------------------------------------------
    */

    const isMaster =
      req.user.role === "master";

    const isAdmin =
      req.user.role === "admin";

    const isUploader =
      baseNote.uploadedBy.toString() ===
      req.user._id.toString();

    const canEdit =
      isMaster ||
      (isAdmin &&
        req.user.permissions?.editContent) ||
      isUploader;

    if (!canEdit) {
      fs.unlink(
        req.file.path,
        () => {}
      );

      return res.status(403).json({
        message:
          "You do not have permission to update this note",
      });
    }

    /*
    -----------------------------------------------
    FIND LATEST VERSION
    -----------------------------------------------
    */

    const latestVersion =
      await Note.findOne({
        noteSeriesId:
          baseNote.noteSeriesId,
      }).sort({
        version: -1,
      });

    const nextVersion =
      (latestVersion?.version || 0) + 1;

    /*
    -----------------------------------------------
    CREATE NEW VERSION
    -----------------------------------------------
    */

    const newVersion =
      await Note.create({
        title: baseNote.title,
        description:
          baseNote.description,

        semester: baseNote.semester,
        subject: baseNote.subject,

        unit: baseNote.unit,
        topic: baseNote.topic,

        fileUrl: req.file.path,
        fileName:
          req.file.originalname,

        uploadedBy: req.user._id,

        noteSeriesId:
          baseNote.noteSeriesId,

        version: nextVersion,

        previousVersion:
          baseNote._id,

        // New version is pending
        isCurrent: false,
        status: "PENDING",

        downloadCount: 0,
      });

    return res.status(201).json({
      message:
        "New note version uploaded and is waiting for approval",

      note: {
        id: newVersion._id,
        version: newVersion.version,
        status: newVersion.status,
        isCurrent:
          newVersion.isCurrent,
        previousVersion:
          newVersion.previousVersion,
      },
    });
  } catch (error) {
    console.error(
      "Create note version error:",
      error
    );

    /*
    -----------------------------------------------
    DELETE FILE IF CREATION FAILED
    -----------------------------------------------
    */

    if (req.file?.path) {
      fs.unlink(
        req.file.path,
        (unlinkError) => {
          if (unlinkError) {
            console.error(
              "Failed to delete uploaded file:",
              unlinkError
            );
          }
        }
      );
    }

    return res.status(500).json({
      message:
        "Failed to create note version",
    });
  }
};

/*
==================================================
PREVIEW PENDING NOTE FOR ADMIN
GET /api/admin/notes/:id/preview

Used to get metadata for Admin moderation.
==================================================
*/

const previewNoteForAdmin = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    /*
    -----------------------------------------------
    VALIDATE ID
    -----------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    /*
    -----------------------------------------------
    FIND NOTE
    -----------------------------------------------
    */

    const note =
      await Note.findById(id)
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
    -----------------------------------------------
    ONLY PENDING NOTES
    -----------------------------------------------
    */

    if (note.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Only pending notes can be previewed for moderation",
      });
    }

    /*
    -----------------------------------------------
    MASTER
    -----------------------------------------------
    */

    if (req.user.role === "master") {
      return res.status(200).json({
        note,
      });
    }

    /*
    -----------------------------------------------
    ADMIN PERMISSION
    -----------------------------------------------
    */

    if (
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to review notes",
      });
    }

    if (
      !req.user.permissions?.approveNotes
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to review notes",
      });
    }

    /*
    -----------------------------------------------
    ADMIN SUBJECT ACCESS
    -----------------------------------------------
    */

    const hasSubjectAccess =
      req.user.assignedSubjects?.some(
        (subjectId) =>
          subjectId.toString() ===
          note.subject._id.toString()
      );

    if (!hasSubjectAccess) {
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
      "Preview note for admin error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to preview note",
    });
  }
};

/*
==================================================
READ PENDING NOTE FOR ADMIN
GET /api/admin/notes/:id/read

Allows Admin/Master to view a pending PDF.

Does NOT increase downloadCount.
==================================================
*/

const readPendingNote = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    /*
    -----------------------------------------------
    VALIDATE ID
    -----------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    /*
    -----------------------------------------------
    FIND NOTE
    -----------------------------------------------
    */

    const note =
      await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    /*
    -----------------------------------------------
    ONLY PENDING NOTES
    -----------------------------------------------
    */

    if (note.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Only pending notes can be reviewed",
      });
    }

    /*
    -----------------------------------------------
    MASTER
    -----------------------------------------------
    */

    if (
      req.user.role === "master"
    ) {
      // Master has access to all notes.
    }

    /*
    -----------------------------------------------
    ADMIN
    -----------------------------------------------
    */

    else {
      if (
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message:
            "You do not have permission to review notes",
        });
      }

      /*
      Admin needs approveNotes permission.
      */

      if (
        !req.user.permissions?.approveNotes
      ) {
        return res.status(403).json({
          message:
            "You do not have permission to review notes",
        });
      }

      /*
      ---------------------------------------------
      ADMIN SUBJECT ACCESS
      ---------------------------------------------
      */

      const hasSubjectAccess =
        req.user.assignedSubjects?.some(
          (subjectId) =>
            subjectId.toString() ===
            note.subject.toString()
        );

      if (!hasSubjectAccess) {
        return res.status(403).json({
          message:
            "You do not have access to this subject",
        });
      }
    }

    /*
    -----------------------------------------------
    CHECK PDF
    -----------------------------------------------
    */

    if (
      !note.fileUrl ||
      !fs.existsSync(note.fileUrl)
    ) {
      return res.status(404).json({
        message: "PDF file not found",
      });
    }

    /*
    -----------------------------------------------
    STREAM PDF
    -----------------------------------------------
    */

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${note.fileName}"`
    );

    const fileStream =
      fs.createReadStream(
        note.fileUrl
      );

    fileStream.on(
      "error",
      (error) => {
        console.error(
          "Pending PDF read stream error:",
          error
        );

        if (!res.headersSent) {
          res.status(500).json({
            message:
              "Failed to read PDF",
          });
        }
      }
    );

    fileStream.pipe(res);
  } catch (error) {
    console.error(
      "Read pending note error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        message:
          "Failed to read pending note",
      });
    }
  }
};

/*
==================================================
EXPORT CONTROLLERS
==================================================
*/

module.exports = {
  getNotes,
  getMyNotes,
  deleteMyNote,
  getNoteById,
  readNote,
  downloadNote,
  createNote,
  createNoteVersion,

  // Admin moderation
  previewNoteForAdmin,
  readPendingNote,
};