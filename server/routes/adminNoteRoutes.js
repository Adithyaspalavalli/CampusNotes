const express = require("express");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminmiddleware");

// Existing admin note controller
const {
  getPendingNotes,
  getNoteForReview,
  approveNote,
  rejectNote,
} = require("../controllers/adminNoteController");

// Note controller functions for PDF preview
const {
  previewNoteForAdmin,
  readPendingNote,
} = require("../controllers/noteController");

const router = express.Router();

/*
==================================================
PENDING NOTES
GET /api/admin/notes/pending
==================================================
*/

router.get(
  "/pending",
  protect,
  adminOnly,
  getPendingNotes
);

/*
==================================================
PREVIEW PENDING NOTE
GET /api/admin/notes/:id/preview

Returns note information for Admin/Master review.
==================================================
*/

router.get(
  "/:id/preview",
  protect,
  adminOnly,
  previewNoteForAdmin
);

/*
==================================================
READ PENDING PDF
GET /api/admin/notes/:id/read

Allows Admin/Master to view a pending PDF.
Does NOT increase download count.
==================================================
*/

router.get(
  "/:id/read",
  protect,
  adminOnly,
  readPendingNote
);

/*
==================================================
REVIEW ONE NOTE
GET /api/admin/notes/:id
==================================================
*/

router.get(
  "/:id",
  protect,
  adminOnly,
  getNoteForReview
);

/*
==================================================
APPROVE NOTE
PUT /api/admin/notes/:id/approve
==================================================
*/

router.put(
  "/:id/approve",
  protect,
  adminOnly,
  approveNote
);

/*
==================================================
REJECT NOTE
PUT /api/admin/notes/:id/reject
==================================================
*/

router.put(
  "/:id/reject",
  protect,
  adminOnly,
  rejectNote
);

module.exports = router;