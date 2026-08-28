const mongoose = require("mongoose");
const fs = require("fs");

const Note = require("../models/Note");
const Subject = require("../models/Subject");

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

    // Create note
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

      status: "PENDING",
    });

    res.status(201).json({
      message:
        "Note uploaded successfully and is waiting for admin approval",

      note: {
        id: note._id,
        title: note.title,
        semester: note.semester,
        subject: note.subject,
        unit: note.unit,
        topic: note.topic,
        status: note.status,
      },
    });
  } catch (error) {
    console.error(
      "Create note error:",
      error
    );

    // Remove the uploaded file if note creation fails.
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
      message: "Failed to upload note",
    });
  }
};

module.exports = {
  createNote,
};