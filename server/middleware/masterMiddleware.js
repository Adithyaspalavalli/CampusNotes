const masterOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authorized.",
    });
  }

  if (req.user.role !== "master") {
    return res.status(403).json({
      message: "Master access required.",
    });
  }

  next();
};

module.exports = masterOnly;