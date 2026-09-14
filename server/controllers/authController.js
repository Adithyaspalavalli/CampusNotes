const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

/*
==================================================
REGISTER USER
POST /api/auth/register
==================================================
*/

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    /*
    -----------------------------------------------
    VALIDATE REQUIRED FIELDS
    -----------------------------------------------
    */

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Please provide name, email and password",
      });
    }

    /*
    -----------------------------------------------
    CHECK EXISTING USER
    -----------------------------------------------
    */

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    /*
    -----------------------------------------------
    HASH PASSWORD
    -----------------------------------------------
    */

    const hashedPassword =
      await bcrypt.hash(password, 10);

    /*
    -----------------------------------------------
    CREATE STUDENT
    -----------------------------------------------

    Normal registration always creates a Student.
    Admin/Master accounts are created separately.
    */

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      isActive: true,
    });

    /*
    -----------------------------------------------
    RESPONSE
    -----------------------------------------------
    */

    return res.status(201).json({
      message:
        "Registration successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/*
==================================================
LOGIN USER
POST /api/auth/login
==================================================
*/

const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    /*
    -----------------------------------------------
    VALIDATE INPUT
    -----------------------------------------------
    */

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Please provide email and password",
      });
    }

    /*
    -----------------------------------------------
    FIND USER
    -----------------------------------------------
    */

    const user =
      await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    /*
    -----------------------------------------------
    CHECK ACCOUNT STATUS
    -----------------------------------------------
    */

    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Your account has been disabled",
      });
    }

    /*
    -----------------------------------------------
    CHECK PASSWORD
    -----------------------------------------------
    */

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    /*
    -----------------------------------------------
    CREATE JWT
    -----------------------------------------------
    */

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    /*
    -----------------------------------------------
    LOGIN RESPONSE
    -----------------------------------------------
    */

    return res.json({
      message:
        "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/*
==================================================
GET CURRENT USER
GET /api/auth/me

Returns the latest information about the
authenticated user.

Important for:

- Admin assigned subjects
- Admin permissions
- Current account information
==================================================
*/

const getCurrentUser = async (req, res) => {
  try {
    /*
    -----------------------------------------------
    FIND USER
    -----------------------------------------------
    
    req.user is already populated by protect
    middleware.
    
    We fetch the user again so we always get the
    latest database information.
    */

    const user =
      await User.findById(req.user._id)
        .populate(
          "assignedSubjects",
          "name code semester isActive"
        )
        .select(
          "-password"
        );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    /*
    -----------------------------------------------
    CHECK ACCOUNT STATUS
    -----------------------------------------------
    */

    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Your account has been disabled",
      });
    }

    /*
    -----------------------------------------------
    RESPONSE
    -----------------------------------------------
    */

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,

        /*
        Admin subject assignments
        */

        assignedSubjects:
          user.assignedSubjects || [],

        /*
        Admin permissions
        */

        permissions:
          user.permissions || {},
      },
    });

  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch current user",
    });
  }
};

/*
==================================================
EXPORT
==================================================
*/

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};