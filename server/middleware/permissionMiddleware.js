const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized.",
      });
    }

    // Master has all permissions
    if (req.user.role === "master") {
      return next();
    }

    // Only admins can use admin permissions
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    // Check permission
    if (!req.user.permissions?.[permission]) {
      return res.status(403).json({
        message: `You do not have permission: ${permission}`,
      });
    }

    next();
  };
};

module.exports = requirePermission;