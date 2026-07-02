const {
  PutObjectCommand
} = require("@aws-sdk/client-s3");

const s3 = require("../config/aws");

async function uploadToS3(file) {

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  await s3.send(
    new PutObjectCommand(params)
  );

  return `Uploaded: ${file.originalname}`;
}

module.exports = {
  uploadToS3
};