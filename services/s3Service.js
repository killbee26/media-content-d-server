const { s3 } = require('../config/awsConfig');

const uploadFileToS3 = (file) => {
  const params = {
    Bucket: process.env.S3_BUCKET_TEMP,
    Key: file.originalname,
    Body: file.buffer,
  };

  return s3.upload(params).promise();
};

module.exports = { uploadFileToS3 };
