const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  changePassword,
} = require("../controllers/passwordcontroller");

const router = express.Router();


// Change password
router.put(
  "/change",
  protect,
  changePassword
);


module.exports = router;