const { uploadFileToS3 } = require('../services/s3Service');
const { addToQueue } = require('../services/redisService');
const { v4: uuidv4 } = require('uuid');
const Video = require('../models/Video'); // Import Video model

const uploadFile = async (req, res, next) => {
  try {
    const file = req.file
    
    // Step 1: Upload to S3
    const result = await uploadFileToS3(file);

    // Define processed keys with placeholders
    const originalFileName = file.originalname;
    const baseFileName = originalFileName.split('.')[0]; // Get filename without extension
    const processedS3Keys = {
      high: `processed/1920x1080/${baseFileName}.mp4`,
      medium: `processed/1280x720/${baseFileName}.mp4`,
      low: `processed/640x360/${baseFileName}.mp4`,
    };

    const video = new Video({
      name: originalFileName,
      originalS3Key: result.Key,
      processedS3Keys: processedS3Keys,
      status: 'pending',
    });
    await video.save();
    // Step 2: Add job to Redis queue
    const jobDetails = {
      s3Key: result.Key,
      status: 'pending',
      jobID: uuidv4(),
      retries: 0,
    };
    await addToQueue(jobDetails);

    // Step 3: Save metadata to MongoDB
    

    // Step 4: Return response
    res.status(200).json({
      message: 'File uploaded and metadata saved successfully',
      jobDetails,
      video,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadFile };
