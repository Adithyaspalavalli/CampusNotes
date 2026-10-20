const express = require("express");
const router = express.Router();

const {
  uploadToB2,
  getB2ReadUrl,
} = require("../services/b2Storage");

router.post("/test-upload", async (req, res) => {
  try {
    const testContent = Buffer.from(
      "CampusNotes Backblaze B2 connection test"
    );

    const key = `test/campusnotes-test-${Date.now()}.txt`;

    await uploadToB2({
      key,
      body: testContent,
      contentType: "text/plain",
    });

    const readUrl = await getB2ReadUrl(key);

    return res.json({
      message: "B2 upload successful",
      key,
      readUrl,
    });
  } catch (error) {
    console.error("B2 test upload failed:", error);

    return res.status(500).json({
      message: "B2 test upload failed",
    });
  }
});

module.exports = router;
