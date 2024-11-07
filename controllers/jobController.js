const { runEcsTask } = require('../services/ecsService');
const { monitorTasksAndRemoveJobs } = require('../utils/taskMonitor');
const { addToQueue } = require('../services/redisService'); // Assuming you have this method to add jobs

// Controller function to handle job creation and processing
const addJob = async (req, res, next) => {
    try {
        // Log when the function is called
        console.log("addJob function was called!");

        // Log the incoming request body
        console.log('Request body:', req.body);

        // Extracting s3key and jobID from the request body
        const s3key = req.body.s3key; // Ensure you are reading from the correct property
        const jobID = req.body.jobID;   // Ensure you are reading from the correct property

        // Log the extracted values
        console.log('Extracted s3Key:', s3key);
        console.log('Extracted jobID:', jobID);

        // Create job data object
        const jobData = {
            s3Key: s3key,
            status: 'pending',
            jobID: jobID,
            retries: 0,
        };

        // Log before adding to the queue
        console.log('Adding job to queue:', jobData);
        
        // Add job to the Redis queue
        await addToQueue(jobData);

        // Log after the job is added to the queue
        console.log('Job added to queue successfully:', jobData);

        // Send success response
        res.status(200).json({ message: 'Job added successfully!', jobData });
    } catch (err) {
        // Log any errors that occur
        console.error("Error posting job to queue:", err);
        next(err); // Pass the error to the next middleware
    }
};

module.exports = {
    addJob,
};
