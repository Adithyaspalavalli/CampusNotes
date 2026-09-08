const express = require("express");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getNotes,
  getMyNotes,
  getNoteById,
  readNote,
  downloadNote,
  createNote,
  createNoteVersion,
  deleteMyNote,
} = require("../controllers/noteController");

const router = express.Router();


router.get("/", protect, getNotes);

router.get("/my", protect, getMyNotes);

router.get("/:id/read", protect, readNote);
router.get("/:id/download", protect, downloadNote);
router.get("/:id", protect, getNoteById);

router.post("/", protect, upload.single("file"), createNote);
router.post(
  "/:id/version",
  protect,
  upload.single("file"),
  createNoteVersion
);

router.delete("/:id", protect, deleteMyNote);

module.exports = router;