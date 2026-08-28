const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Subject = require("../models/Subject");

// Get all admins
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find(
      { role: "admin" },
      {
        password: 0,
      }
    ).populate({
      path: "assignedSubjects",
      model: Subject,
      select: "name code semester",
    });

    res.json({
      count: admins.length,
      admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);

    res.status(500).json({
      message: "Failed to fetch admins",
    });
  }
};

// Create admin
const createAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      isActive: true,

      permissions: {
        approveNotes: false,
        rejectNotes: false,
        deleteNotes: false,
        editContent: false,
        manageSubjects: false,
        disableUsers: false,
        viewStatistics: true,
      },

      assignedSubjects: [],
    });

    res.status(201).json({
      message: "Admin created successfully",

      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        permissions: admin.permissions,
        assignedSubjects: admin.assignedSubjects,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);

    res.status(500).json({
      message: "Failed to create admin",
    });
  }
};

// Update admin permissions
const updateAdminPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const permissions = {
      approveNotes: Boolean(req.body.approveNotes),
      rejectNotes: Boolean(req.body.rejectNotes),
      deleteNotes: Boolean(req.body.deleteNotes),
      editContent: Boolean(req.body.editContent),
      manageSubjects: Boolean(req.body.manageSubjects),
      disableUsers: Boolean(req.body.disableUsers),
      viewStatistics:
        req.body.viewStatistics === undefined
          ? true
          : Boolean(req.body.viewStatistics),
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "A valid admin ID is required",
      });
    }

    const admin = await User.findOne({
      _id: id,
      role: "admin",
    });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    admin.permissions = permissions;
    await admin.save();

    res.json({
      message: "Admin permissions updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error("Update admin permissions error:", error);
    res.status(500).json({
      message: "Failed to update admin permissions",
    });
  }
};

// Assign subjects to admin
const updateAdminSubjects = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "A valid admin ID is required",
      });
    }

    if (!Array.isArray(subjectIds)) {
      return res.status(400).json({
        message: "subjectIds must be an array",
      });
    }

    if (subjectIds.some((subjectId) => !mongoose.Types.ObjectId.isValid(subjectId))) {
      return res.status(400).json({
        message: "subjectIds must contain valid subject IDs",
      });
    }

    const admin = await User.findOne({
      _id: id,
      role: "admin",
    });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    const subjects = await Subject.find({
      _id: { $in: subjectIds },
    }).select("_id");

    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({
        message: "One or more subjects were not found",
      });
    }

    admin.assignedSubjects = subjectIds;

    await admin.save();

    const updatedAdmin = await User.findById(
      admin._id
    )
      .select("-password")
      .populate(
        "assignedSubjects",
        "name code semester"
      );

    res.json({
      message: "Admin subjects updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error(
      "Update admin subjects error:",
      error
    );

    res.status(500).json({
      message: "Failed to update admin subjects",
    });
  }
};

const toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findOne({
      _id: id,
      role: "admin",
    });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    admin.isActive = !admin.isActive;

    await admin.save();

    res.json({
      message: admin.isActive
        ? "Admin enabled successfully"
        : "Admin disabled successfully",

      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Toggle admin status error:",
      error
    );

    res.status(500).json({
      message: "Failed to update admin status",
    });
  }
};

//Delete the admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findOne({
      _id: id,
      role: "admin",
    });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete admin error:",
      error
    );

    res.status(500).json({
      message: "Failed to delete admin",
    });
  }
};

module.exports = {
  getAdmins,
  createAdmin,
  updateAdminPermissions,
  updateAdminSubjects,
  toggleAdminStatus,
    deleteAdmin,
};