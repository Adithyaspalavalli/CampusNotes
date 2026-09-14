const mongoose = require("mongoose");
const User = require("../models/User");

// =====================================================
// GET ALL USERS
// =====================================================

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(
      "Get all users error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};


// =====================================================
// CHANGE USER ROLE
// =====================================================

const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({
        message:
          "Role must be either student or admin",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // A Master account cannot be changed
    // through normal user management.
    if (user.role === "master") {
      return res.status(403).json({
        message:
          "Master role cannot be changed",
      });
    }

    user.role = role;

    await user.save();

    return res.status(200).json({
      message:
        "User role updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Change user role error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update user role",
    });
  }
};


// =====================================================
// TOGGLE USER STATUS
// =====================================================

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Master account cannot be disabled
    // from normal user management.
    if (user.role === "master") {
      return res.status(403).json({
        message:
          "Master account cannot be disabled",
      });
    }

    user.isActive = !user.isActive;

    await user.save();

    return res.status(200).json({
      message: user.isActive
        ? "User enabled successfully"
        : "User disabled successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Toggle user status error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update user status",
    });
  }
};


module.exports = {
  getAllUsers,
  changeUserRole,
  toggleUserStatus,
};