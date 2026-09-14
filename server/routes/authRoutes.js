const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  getCurrentUser,
} = require("../controllers/authController");

const router = express.Router();

/*
==================================================
REGISTER
==================================================
*/

router.post(
  "/register",
  registerUser
);

/*
==================================================
LOGIN
==================================================
*/

router.post(
  "/login",
  loginUser
);

/*
==================================================
CURRENT USER
==================================================

Requires a valid JWT.

The protect middleware will:

1. Read Authorization header
2. Verify JWT
3. Find user
4. Check account status
5. Set req.user
==================================================
*/

router.get(
  "/me",
  protect,
  getCurrentUser
);

module.exports = router;