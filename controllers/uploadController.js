const { uploadFileToS3 } = require('../services/s3Service');
const { addToQueue } = require('../services/redisService');
const { v4: uuidv4 } = require('uuid');

const uploadFile = async (req, res, next) => {
  try {
    const file = req.file;
    const result = await uploadFileToS3(file);

    const jobDetails = {
      s3Key: result.Key,
      status: 'pending',
      jobID: uuidv4(),
      retries: 0
    };

    await addToQueue(jobDetails); // Add the job to the Redis queue

    res.status(200).json({ message: 'File uploaded successfully', jobDetails });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadFile };
