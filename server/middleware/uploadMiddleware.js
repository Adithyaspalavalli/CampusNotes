const multer = require("multer");
const path = require("path");
const fs = require("fs");


// Create uploads directory if it doesn't exist
const uploadDirectory = path.join(
  __dirname,
  "../uploads"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}


// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});


// File validation
const fileFilter = (
  req,
  file,
  cb
) => {
  const extension =
    path.extname(
      file.originalname
    ).toLowerCase();

  const allowedMimeType =
    "application/pdf";

  if (
    extension !== ".pdf" ||
    file.mimetype !== allowedMimeType
  ) {
    return cb(
      new Error(
        "Only PDF files are allowed"
      )
    );
  }

  cb(null, true);
};


// Multer configuration
const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;