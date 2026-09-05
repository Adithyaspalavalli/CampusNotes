const mongoose = require("mongoose");

const Subject = require("../models/Subject");


// Get all subjects
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .sort({
        semester: 1,
        name: 1,
      });

    res.json({
      count: subjects.length,
      subjects,
    });
  } catch (error) {
    console.error(
      "Get subjects error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch subjects",
    });
  }
};


// Create subject
const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      semester,
    } = req.body;

    // Required fields
    if (
      !name ||
      !code ||
      !semester
    ) {
      return res.status(400).json({
        message:
          "Name, code and semester are required",
      });
    }

    // Validate semester
    const semesterNumber =
      Number(semester);

    if (
      !Number.isInteger(
        semesterNumber
      ) ||
      semesterNumber < 1 ||
      semesterNumber > 8
    ) {
      return res.status(400).json({
        message:
          "Semester must be a number between 1 and 8",
      });
    }

    // Clean values
    const cleanName =
      name.trim();

    const cleanCode =
      code.trim().toUpperCase();

    // Check duplicate code
    const existingSubject =
      await Subject.findOne({
        code: cleanCode,
      });

    if (existingSubject) {
      return res.status(409).json({
        message:
          "A subject with this code already exists",
      });
    }

    // Create
    const subject =
      await Subject.create({
        name: cleanName,
        code: cleanCode,
        semester: semesterNumber,
        isActive: true,
      });

    res.status(201).json({
      message:
        "Subject created successfully",

      subject,
    });
  } catch (error) {
    console.error(
      "Create subject error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create subject",
    });
  }
};


// Update subject
const updateSubject = async (req, res) => {
  try {
    const { id } =
      req.params;

    const {
      name,
      code,
      semester,
    } = req.body;

    // Validate ID
    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        message: "Invalid subject ID",
      });
    }

    const subject =
      await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        message:
          "Subject not found",
      });
    }

    // Update name
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message:
            "Subject name cannot be empty",
        });
      }

      subject.name =
        name.trim();
    }

    // Update code
    if (code !== undefined) {
      const cleanCode =
        code.trim().toUpperCase();

      const duplicate =
        await Subject.findOne({
          code: cleanCode,
          _id: {
            $ne: id,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          message:
            "Another subject already uses this code",
        });
      }

      subject.code =
        cleanCode;
    }

    // Update semester
    if (semester !== undefined) {
      const semesterNumber =
        Number(semester);

      if (
        !Number.isInteger(
          semesterNumber
        ) ||
        semesterNumber < 1 ||
        semesterNumber > 8
      ) {
        return res.status(400).json({
          message:
            "Semester must be a number between 1 and 8",
        });
      }

      subject.semester =
        semesterNumber;
    }

    await subject.save();

    res.json({
      message:
        "Subject updated successfully",

      subject,
    });
  } catch (error) {
    console.error(
      "Update subject error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update subject",
    });
  }
};


// Enable / disable subject
const toggleSubjectStatus = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        message: "Invalid subject ID",
      });
    }

    const subject =
      await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        message:
          "Subject not found",
      });
    }

    subject.isActive =
      !subject.isActive;

    await subject.save();

    res.json({
      message: subject.isActive
        ? "Subject enabled successfully"
        : "Subject disabled successfully",

      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        semester: subject.semester,
        isActive:
          subject.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Toggle subject error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update subject status",
    });
  }
};


module.exports = {
  getAllSubjects,
  createSubject,
  updateSubject,
  toggleSubjectStatus,
};