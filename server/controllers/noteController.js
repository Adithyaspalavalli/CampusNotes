const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Note = require("../models/Note");
const Subject = require("../models/Subject");
const DownloadEvent = require("../models/DownloadEvent");

const {
  uploadToB2,
  getB2ReadUrl,
  getB2DownloadUrl,
  getB2File,
  deleteFromB2,
} = require("../services/b2Storage");

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

PERMISSIONS

STUDENT:
- Can delete own PENDING note
- Cannot delete APPROVED note
- Cannot delete OUTDATED note
- Can delete own REJECTED note

ADMIN:
- Requires deleteNotes permission
- Must have access to note subject
- Can delete any status

MASTER:
- Can delete any note
==================================================
*/

const deleteMyNote = async (req, res) => {
  try {
    const { id } = req.params;

    /*
    -----------------------------------------------
    VALIDATE NOTE ID
    -----------------------------------------------
    */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    /*
    -----------------------------------------------
    FIND NOTE
    -----------------------------------------------
    */

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    /*
    ==================================================
    MASTER
    ==================================================
    */

    if (req.user.role === "master") {
      // Master can delete any note.
    }

    /*
    ==================================================
    ADMIN
    ==================================================
    */

    else if (req.user.role === "admin") {
      /*
      -----------------------------------------------
      CHECK DELETE PERMISSION
      -----------------------------------------------
      */

      if (
        req.user.permissions?.deleteNotes !== true
      ) {
        return res.status(403).json({
          message:
            "You do not have permission to delete notes",
        });
      }

      /*
      -----------------------------------------------
      CHECK SUBJECT ACCESS
      -----------------------------------------------
      */

      const assignedSubjects =
        req.user.assignedSubjects || [];

      const hasAccess =
        assignedSubjects.some(
          (subjectId) =>
            subjectId.toString() ===
            note.subject.toString()
        );

      if (!hasAccess) {
        return res.status(403).json({
          message:
            "You do not have access to this subject",
        });
      }
    }

    /*
    ==================================================
    STUDENT
    ==================================================
    */

    else if (req.user.role === "student") {
      /*
      -----------------------------------------------
      CHECK OWNERSHIP
      -----------------------------------------------
      */

      if (
        note.uploadedBy.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          message:
            "You can only delete your own notes",
        });
      }

      /*
      -----------------------------------------------
      STUDENT STATUS RULE
      -----------------------------------------------

      Student can delete:

      PENDING
      REJECTED

      Student cannot delete:

      APPROVED
      OUTDATED
      */

      if (
        note.status !== "PENDING" &&
        note.status !== "REJECTED"
      ) {
        return res.status(403).json({
          message:
            "You cannot delete an approved or outdated note",
        });
      }
    }

    /*
    ==================================================
    UNKNOWN ROLE
    ==================================================
    */

    else {
      return res.status(403).json({
        message:
          "You do not have permission to delete notes",
      });
    }

    /*
    -----------------------------------------------
    DELETE PDF FROM BACKBLAZE B2
    -----------------------------------------------
    */

    if (note.fileUrl) {
      try {
        await deleteFromB2(note.fileUrl);
      } catch (b2Error) {
        console.error(
          "Failed to delete PDF from Backblaze B2:",
          b2Error
        );

        return res.status(500).json({
          message:
            "Failed to delete PDF from cloud storage",
        });
      }
    }

    /*
    ==================================================
    DELETE DATABASE RECORD
    ==================================================
    */

    await Note.findByIdAndDelete(id);

    /*
    ==================================================
    RESPONSE
    ==================================================
    */

    return res.status(200).json({
      message: "Note deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete note error:",
      error
    );

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

    /*
    -----------------------------------------------
    VALIDATE ID
    -----------------------------------------------
    */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    /*
    -----------------------------------------------
    ONLY APPROVED + CURRENT NOTES
    -----------------------------------------------
    */

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
    console.error(
      "Get note by ID error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch note",
    });
  }
};

/*
==================================================
READ APPROVED CURRENT NOTE
GET /api/notes/:id/read

Does NOT increase downloadCount.
==================================================
*/

const readNote = async (req, res) => {
  try {
    const { id } = req.params;

    /*
    -----------------------------------------------
    VALIDATE ID
    -----------------------------------------------
    */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    /*
    -----------------------------------------------
    ONLY APPROVED + CURRENT NOTES
    -----------------------------------------------
    */

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

    if (!note.fileUrl) {
      return res.status(404).json({
        message: "PDF file not found",
      });
    }

    let fileStream;

    if (
      path.isAbsolute(note.fileUrl) ||
      path.win32.isAbsolute(note.fileUrl)
    ) {
      if (!fs.existsSync(note.fileUrl)) {
        return res.status(404).json({
          message: "PDF file not found",
        });
      }

      fileStream = fs.createReadStream(note.fileUrl);
    } else {
      const b2File = await getB2File(note.fileUrl);

      if (!b2File.Body) {
        throw new Error("B2 returned an empty file body");
      }

      fileStream = b2File.Body;
    }

    /*
    -----------------------------------------------
    PDF RESPONSE
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

    fileStream.on(
      "error",
      (error) => {
        console.error(
          "PDF read stream error:",
          error
        );

        if (!res.headersSent) {
          res.status(500).json({
            message: "Failed to read PDF",
          });
        } else {
          res.destroy(error);
        }
      }
    );

    fileStream.pipe(res);

  } catch (error) {
    console.error(
      "Read note error:",
      error
    );

    if (
      error.name === "NoSuchKey" ||
      error.name === "NotFound" ||
      error.$metadata?.httpStatusCode === 404
    ) {
      return res.status(404).json({
        message: "PDF file not found",
      });
    }

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    const note = await Note.findOne({
      _id: id,
      status: "APPROVED",
      isCurrent: true,
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found or is no longer available",
      });
    }

    if (!note.fileUrl) {
      return res.status(404).json({
        message: "PDF file not found",
      });
    }

    // Support both older local files and Backblaze B2.
    let fileStream;

    const isLocalFile =
      path.isAbsolute(note.fileUrl) ||
      path.win32.isAbsolute(note.fileUrl);

    if (isLocalFile) {
      if (!fs.existsSync(note.fileUrl)) {
        return res.status(404).json({
          message: "PDF file not found",
        });
      }

      fileStream = fs.createReadStream(note.fileUrl);
    } else {
      const b2File = await getB2File(note.fileUrl);

      if (!b2File.Body) {
        return res.status(404).json({
          message: "PDF file not found in cloud storage",
        });
      }

      fileStream = b2File.Body;
    }

    // Record analytics only after the response finishes.
    res.on("finish", async () => {
      if (res.statusCode >= 400) return;

      try {
        await Promise.all([
          Note.updateOne(
            { _id: note._id },
            { $inc: { downloadCount: 1 } }
          ),

          DownloadEvent.create({
            note: note._id,
            subject: note.subject,
            student: req.user._id,
            downloadedAt: new Date(),
          }),
        ]);
      } catch (trackingError) {
        console.error(
          "Failed to record download analytics:",
          trackingError
        );
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${note.fileName.replace(/["\r\n]/g, "_")}"`
    );

    fileStream.on("error", (error) => {
      console.error("PDF download stream error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          message: "Failed to download PDF",
        });
      } else {
        res.destroy(error);
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("Download note error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Failed to download note",
      });
    }

    res.destroy(error);
  }
};

/*
==================================================
CREATE NOTE
POST /api/notes
==================================================
*/

const createNote = async (req, res) => {
  let uploadedB2Key = null;

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
        message:
          "Invalid or inactive subject",
      });
    }

    /*
    -----------------------------------------------
    CHECK SEMESTER
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
    READ TEMPORARY LOCAL FILE
    -----------------------------------------------
    */

    const fileBuffer = await fs.promises.readFile(
      req.file.path
    );

    /*
    -----------------------------------------------
    CREATE NOTE SERIES
    -----------------------------------------------
    */

    const noteSeriesId =
      new mongoose.Types.ObjectId();

    /*
    -----------------------------------------------
    CREATE B2 FILE KEY
    -----------------------------------------------
    */

    const b2Key = `notes/${noteSeriesId.toString()}/v1-${Date.now()}.pdf`;

    /*
    -----------------------------------------------
    UPLOAD PDF TO BACKBLAZE B2
    -----------------------------------------------
    */

    await uploadToB2({
      key: b2Key,
      body: fileBuffer,
      contentType: "application/pdf",
    });

    uploadedB2Key = b2Key;

    /*
    -----------------------------------------------
    DELETE TEMPORARY LOCAL FILE
    -----------------------------------------------
    */

    await fs.promises.unlink(req.file.path);

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

      // Store B2 object key instead of local file path
      fileUrl: b2Key,
      fileName: req.file.originalname,

      uploadedBy: req.user._id,

      noteSeriesId,
      version: 1,
      previousVersion: null,

      // First upload is waiting for approval
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
    DELETE B2 FILE IF DATABASE CREATION FAILS
    -----------------------------------------------
    */

    if (uploadedB2Key) {
      try {
        await deleteFromB2(uploadedB2Key);
      } catch (deleteError) {
        console.error(
          "Failed to delete B2 file after error:",
          deleteError
        );
      }
    }

    /*
    -----------------------------------------------
    DELETE TEMPORARY LOCAL FILE
    -----------------------------------------------
    */

    if (req.file?.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          await fs.promises.unlink(req.file.path);
        }
      } catch (unlinkError) {
        console.error(
          "Failed to delete temporary file:",
          unlinkError
        );
      }
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
      fs.unlink(
        req.file.path,
        () => {}
      );

      return res.status(404).json({
        message: "Note not found",
      });
    }

    /*
    -----------------------------------------------
    ONLY CURRENT APPROVED VERSION
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
        req.user.permissions?.editContent === true) ||
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
    DELETE FILE IF CREATION FAILS
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
==================================================
*/

const previewNoteForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    const note = await Note.findById(id)
      .populate("subject", "name code semester")
      .populate("uploadedBy", "name email");

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    // Pending notes can be reviewed. Current approved notes can be read.
    if (
      note.status !== "PENDING" &&
      !(note.status === "APPROVED" && note.isCurrent)
    ) {
      return res.status(400).json({
        message:
          "This note is no longer available for viewing",
      });
    }

    // Master can access every subject.
    if (req.user.role !== "master") {
      const subjectId =
        note.subject?._id || note.subject;

      const hasAccess =
        (req.user.assignedSubjects || []).some(
          (assignedSubjectId) =>
            assignedSubjectId.toString() ===
            subjectId.toString()
        );

      if (!hasAccess) {
        return res.status(403).json({
          message:
            "You do not have access to this subject",
        });
      }
    }

    return res.status(200).json({
      note,
    });

  } catch (error) {
    console.error(
      "Preview admin note error:",
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

Allows Admin/Master to view pending PDF.

Does NOT increase downloadCount.
==================================================
*/

const readPendingNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    const note = await Note.findById(id)
      .populate("subject", "name code semester")
      .populate("uploadedBy", "name email");

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    /*
      Pending notes can be opened for moderation.
      Current approved notes can be opened for reading.

      Rejected and outdated notes cannot be opened
      through this reader.
    */
    if (
      note.status !== "PENDING" &&
      !(note.status === "APPROVED" && note.isCurrent)
    ) {
      return res.status(400).json({
        message:
          "This note is no longer available for viewing",
      });
    }

    // Master can access every subject.
    if (req.user.role !== "master") {
      const subjectId =
        note.subject?._id || note.subject;

      const hasAccess =
        (req.user.assignedSubjects || []).some(
          (assignedSubjectId) =>
            assignedSubjectId.toString() ===
            subjectId.toString()
        );

      if (!hasAccess) {
        return res.status(403).json({
          message:
            "You do not have access to this subject",
        });
      }
    }

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

    return res.sendFile(
      path.resolve(note.fileUrl)
    );

  } catch (error) {
    console.error(
      "Read admin note error:",
      error
    );

    return res.status(500).json({
      message: "Failed to read note",
    });
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