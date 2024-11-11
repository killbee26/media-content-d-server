const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  originalS3Key: { type: String, required: true },
  processedS3Keys: {
    high: { type: String, required: true },
    medium: { type: String, required: true },
    low: { type: String, required: true }
  }, // Store different processed resolutions or formats here
  uploadedAt: { type: Date, default: Date.now },
  thumbnailUrl: String,
  status: {
    type: String,
    enum: ['pending', 'running', 'finished', 'failed'], // Enum for tracking processing status
    default: 'pending'
  },
  ecsTaskArn: { type: String, required: true }, // Store ECS task ARN to associate task with the video
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
