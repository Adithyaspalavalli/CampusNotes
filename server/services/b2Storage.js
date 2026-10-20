require("dotenv").config();

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.B2_REGION;
const BUCKET_NAME = process.env.B2_BUCKET_NAME;
const APPLICATION_KEY_ID = process.env.B2_APPLICATION_KEY_ID;
const APPLICATION_KEY = process.env.B2_APPLICATION_KEY;

console.log("B2 Storage Service:");
console.log("Region:", REGION);
console.log("Bucket:", BUCKET_NAME);
console.log(
  "Application Key ID:",
  APPLICATION_KEY_ID ? "Loaded" : "Missing"
);
console.log(
  "Application Key:",
  APPLICATION_KEY ? "Loaded" : "Missing"
);

if (!REGION) {
  throw new Error("B2_REGION is missing");
}

if (!BUCKET_NAME) {
  throw new Error("B2_BUCKET_NAME is missing");
}

if (!APPLICATION_KEY_ID) {
  throw new Error("B2_APPLICATION_KEY_ID is missing");
}

if (!APPLICATION_KEY) {
  throw new Error("B2_APPLICATION_KEY is missing");
}

const s3Client = new S3Client({
  region: REGION,
  endpoint: `https://s3.${REGION}.backblazeb2.com`,
  credentials: {
    accessKeyId: APPLICATION_KEY_ID,
    secretAccessKey: APPLICATION_KEY,
  },
});

// Upload file
const uploadToB2 = async ({
  key,
  body,
  contentType = "application/pdf",
}) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return key;
};

// Generate temporary read URL
const getB2ReadUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, {
    expiresIn,
  });
};

// Generate temporary download URL
const getB2DownloadUrl = async (
  key,
  fileName,
  expiresIn = 3600
) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
    ResponseContentType: "application/pdf",
  });

  return await getSignedUrl(s3Client, command, {
    expiresIn,
  });
};

// Delete file
const deleteFromB2 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

// Get PDF/file directly from B2
const getB2File = async (key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await s3Client.send(command);
};

module.exports = {
  uploadToB2,
  getB2ReadUrl,
  getB2DownloadUrl,
  getB2File,
  deleteFromB2,
};