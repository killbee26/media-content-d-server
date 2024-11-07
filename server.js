const express = require('express');
const startWorker = require('./workers/worker')
const  uploadRoutes = require('./routes/uploadRoutes')
const  queueRoutes = require('./routes/queueRoutes')
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;




// Middleware, routes, etc.
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data

// Use the upload routes with a route prefix
app.use('/api/file', uploadRoutes);
app.use('/api/managequeue', queueRoutes);
try {
  startWorker();
} catch (error) {
  console.error('Error starting the worker:', error);
}// Start the queue worker

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
