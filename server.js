const express = require('express');
const startWorker = require('./workers/worker')
const  uploadRoutes = require('./routes/uploadRoutes')
const cors = require('cors');
const  queueRoutes = require('./routes/queueRoutes')
const videoRoutes = require('./routes/videoRoutes')
const mongoose = require('mongoose');

require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;



app.use(cors());
// Middleware, routes, etc.
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data

// Use the upload routes with a route prefix
app.use('/api/file', uploadRoutes);
app.use('/api/managequeue', queueRoutes);
app.use('/api/videos', videoRoutes);
try {
  startWorker();
} catch (error) {
  console.error('Error starting the worker:', error);
}// Start the queue worker
// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/media-content-delivery', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
