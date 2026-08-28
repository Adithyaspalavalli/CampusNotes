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

    fileUrl: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
      ],
      default: "PENDING",
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

    downloadCount: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

noteSchema.index({
  status: 1,
  subject: 1,
  semester: 1,
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