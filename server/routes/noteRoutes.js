const express = require("express");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  createNote,
} = require("../controllers/noteController");

const router = express.Router();


// Upload a note
router.post(
  "/",
  protect,
  upload.single("file"),
  createNote
);

module.exports = router;