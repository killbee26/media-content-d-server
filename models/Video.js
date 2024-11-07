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
  status: { type: String, default: 'pending' } // Optional: for tracking processing status
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
