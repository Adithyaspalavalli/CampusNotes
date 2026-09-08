const mongoose = require("mongoose");
const fs = require("fs");

const Note = require("../models/Note");
const Subject = require("../models/Subject");

const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      status: "APPROVED",
      isCurrent: true,
    })
      .populate("subject", "name code semester")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({
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

const deleteMyNote = async (req, res) => {
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

    if (req.user.role !== "master") {
      if (
        note.uploadedBy.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "You can only delete your own notes",
        });
      }
    }

    if (note.fileUrl && fs.existsSync(note.fileUrl)) {
      fs.unlinkSync(note.fileUrl);
    }

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

const getNoteById = async (req, res) => {
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
    })
      .populate("subject", "name code semester")
      .populate("uploadedBy", "name email");

    if (!note) {
      return res.status(404).json({
        message: "Note not found or is no longer available",
      });
    }

    return res.status(200).json({ note });
  } catch (error) {
    console.error("Get note by ID error:", error);

    return res.status(500).json({
      message: "Failed to fetch note",
    });
  }
};

const readNote = async (req, res) => {
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

    if (!note.fileUrl || !fs.existsSync(note.fileUrl)) {
      return res.status(404).json({
        message: "PDF file not found",
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${note.fileName}"`
    );

    const fileStream = fs.createReadStream(note.fileUrl);

    fileStream.on("error", (error) => {
      console.error("PDF read stream error:", error);

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

    if (!note.fileUrl || !fs.existsSync(note.fileUrl)) {
      return res.status(404).json({
        message: "PDF file not found",
      });
    }

    note.downloadCount += 1;
    await note.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${note.fileName}"`
    );

    const fileStream = fs.createReadStream(note.fileUrl);

    fileStream.on("error", (error) => {
      console.error("PDF download stream error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          message: "Failed to download PDF",
        });
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
  }
};

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

    // console.log("NOTE BODY:", req.body);
    // console.log("NOTE FILE:", req.file);
    // console.log("TITLE:", title);
    // console.log("DESCRIPTION:", description);
    // console.log("SEMESTER:", semester);
    // console.log("SUBJECT:", subject);
    // console.log("UNIT:", unit);
    // console.log("TOPIC:", topic);

    // Check uploaded file
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF file",
      });
    }

    // Validate required fields
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

    // Validate Subject ObjectId
    if (!mongoose.Types.ObjectId.isValid(subject)) {
      fs.unlink(req.file.path, () => {});

      return res.status(400).json({
        message: "Invalid subject ID",
      });
    }

    // Find subject
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

    // Check semester
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

    // Create a new note series
const noteSeriesId =
  new mongoose.Types.ObjectId();

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

  // First version starts pending
  // and is not publicly current yet.
  isCurrent: false,
  status: "PENDING",

  downloadCount: 0,
});

    return res.status(201).json({
      message: "Note uploaded successfully and is waiting for approval",
      note,
    });
  } catch (error) {
    console.error("Create note error:", error);

    // Remove the uploaded file if note creation fails.
    if (req.file?.path) {
      fs.unlink(req.file.path, (unlinkError) => {
        if (unlinkError) {
          console.error("Failed to delete uploaded file:", unlinkError);
        }
      });
    }

    return res.status(500).json({
      message: "Failed to upload note",
    });
  }
};

const createNoteVersion = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate note ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    // File required
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF file",
      });
    }

    // Find base note
    const baseNote = await Note.findById(id);

    if (!baseNote) {
      // Remove uploaded file
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }

      return res.status(404).json({
        message: "Note not found",
      });
    }

    // Only current approved note can receive an update
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

    // Check permission
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

    // Determine next version number
    const latestVersion =
      await Note.findOne({
        noteSeriesId:
          baseNote.noteSeriesId,
      })
        .sort({
          version: -1,
        });

    const nextVersion =
      (latestVersion?.version || 0) + 1;

    // Create new version
    const newVersion =
      await Note.create({
        title: baseNote.title,
        description: baseNote.description,

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

        // Important:
        // New version is not public yet
        isCurrent: false,
        status: "PENDING",

        downloadCount: 0,
      });

    res.status(201).json({
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

    // Remove uploaded file if database operation failed
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

    res.status(500).json({
      message:
        "Failed to create note version",
    });
  }
};

module.exports = {
  getNotes,
  getMyNotes,
  getNoteById,
  readNote,
  downloadNote,
  createNote,
  createNoteVersion,
  deleteMyNote,
};