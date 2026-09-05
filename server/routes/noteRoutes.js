const express = require("express");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  createNote,
  createNoteVersion,
} = require("../controllers/noteController");

const router = express.Router();


// Upload a note
router.post(
  "/",
  protect,
  upload.single("file"),
  createNote
);
// Upload a new version of an existing note
router.post(
  "/:id/version",
  protect,
  upload.single("file"),
  createNoteVersion
);

module.exports = router;