const express = require("express");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminmiddleware");

const {
  getPendingNotes,
  getNoteForReview,
  approveNote,
  rejectNote,
} = require("../controllers/adminNoteController");

const router = express.Router();


// Pending notes
router.get(
  "/pending",
  protect,
  adminOnly,
  getPendingNotes
);


// Review one note
router.get(
  "/:id",
  protect,
  adminOnly,
  getNoteForReview
);


// Approve note
router.put(
  "/:id/approve",
  protect,
  adminOnly,
  approveNote
);


// Reject note
router.put(
  "/:id/reject",
  protect,
  adminOnly,
  rejectNote
);


module.exports = router;