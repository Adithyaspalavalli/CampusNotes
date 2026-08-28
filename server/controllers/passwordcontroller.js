const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Password validation
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }

  return null;
};

// Change password
const changePassword = async (req, res) => {
  try {
    // Get logged-in user's ID from authentication middleware
    const userId = req.user._id;

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All password fields are required",
      });
    }

    // Check new password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match",
      });
    }

    // Validate new password strength
    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    // Find the logged-in user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    // Prevent using the same password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        message:
          "New password must be different from current password",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    // Update password
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Failed to change password",
    });
  }
};

module.exports = {
  changePassword,
};