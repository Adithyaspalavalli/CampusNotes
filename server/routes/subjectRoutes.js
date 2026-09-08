const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  getActiveSubjects,
} = require("../controllers/subjectController");

const router = express.Router();

router.get(
  "/active",
  protect,
  getActiveSubjects
);

router.get(
  "/",
  protect,
  getActiveSubjects
);

module.exports = router;
