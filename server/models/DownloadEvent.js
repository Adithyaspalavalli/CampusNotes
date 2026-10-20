
const mongoose = require("mongoose");

const downloadEventSchema = new mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true }
);

downloadEventSchema.index({ downloadedAt: -1, subject: 1 });
downloadEventSchema.index({ note: 1, downloadedAt: -1 });

module.exports = mongoose.model("DownloadEvent", downloadEventSchema);
