const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },

    passwordResetRequired: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["student", "admin", "master"],
      default: "student",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Permissions for ADMIN users
    permissions: {
      approveNotes: {
        type: Boolean,
        default: false,
      },

      rejectNotes: {
        type: Boolean,
        default: false,
      },

      deleteNotes: {
        type: Boolean,
        default: false,
      },

      editContent: {
        type: Boolean,
        default: false,
      },

      manageSubjects: {
        type: Boolean,
        default: false,
      },

      disableUsers: {
        type: Boolean,
        default: false,
      },

      viewStatistics: {
        type: Boolean,
        default: true,
      },
    },

    // Subjects this ADMIN is allowed to manage
    assignedSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);