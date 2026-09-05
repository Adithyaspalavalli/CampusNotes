const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    unit: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // File information
    fileUrl: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    // User who uploaded this version
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // -----------------------------
    // VERSION INFORMATION
    // -----------------------------

    // All versions of the same note
    // share the same noteSeriesId
    noteSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Version number
    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    // Previous version
    previousVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
    },

    // Only one version in a series
    // should normally be current
    isCurrent: {
      type: Boolean,
      default: true,
      index: true,
    },

    // -----------------------------
    // MODERATION
    // -----------------------------

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "OUTDATED",
      ],
      default: "PENDING",
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    // -----------------------------
    // STATISTICS
    // -----------------------------

    downloadCount: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);


// Helpful indexes

noteSchema.index({
  status: 1,
  subject: 1,
  semester: 1,
});

noteSchema.index({
  noteSeriesId: 1,
  version: 1,
});

noteSchema.index({
  title: "text",
  topic: "text",
  description: "text",
});


module.exports = mongoose.model(
  "Note",
  noteSchema
);