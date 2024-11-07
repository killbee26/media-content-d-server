const { s3 } = require('../config/awsConfig');
const Video = require('../models/Video'); // Video model for MongoDB

// Function to get all videos uploaded to S3
const getAllVideos = async (req, res, next) => {
  try {
    // Fetch all video documents from MongoDB
    const videos = await Video.find({});

    // Generate signed URLs for each processed video quality
    const videosWithSignedUrls = await Promise.all(
      videos.map(async (video) => {
        const getSignedUrl = (key) => {
          const params = {
            Bucket: process.env.S3_BUCKET_TEMP,
            Key: key,
            Expires: 60 * 60, // 1-hour expiration
          };
          return s3.getSignedUrlPromise('getObject', params);
        };

        // Generate signed URLs for each quality
        return {
          name: video.name,
          originalS3Key: video.originalS3Key,
          processedUrls: {
            high: await getSignedUrl(video.processedS3Keys.high),
            medium: await getSignedUrl(video.processedS3Keys.medium),
            low: await getSignedUrl(video.processedS3Keys.low),
          },
          uploadDate: video.uploadDate,
        };
      })
    );

    res.status(200).json(videosWithSignedUrls);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllVideos };
