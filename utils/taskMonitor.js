const { processQueue } = require('../controllers/queueController');

const monitorTasks = async () => {
  setInterval(async () => {
    try {
      await processQueue(); // Check queue and process jobs
      console.log('Checked the queue and processed jobs successfully.');
    } catch (error) {
      console.error('Error processing jobs from the queue:', error);
    }
  }, 5000); // Check every 5 seconds
};

module.exports = { monitorTasks };
