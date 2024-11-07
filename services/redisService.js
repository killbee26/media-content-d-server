const redis = require('redis');
require('dotenv').config();
console.log('Redis URL:', process.env.REDIS_URL);

// Create Redis client
const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 10000, // 10 seconds
  },
});
console.log('Attempting to connect to Redis...');
// Connect to Redis

client.connect()
  .then(() => {
    console.log('Connected to Redis');
  })
  .catch(err => {
    console.error('Redis connection error:', err);
  });

// Optional: Add event listeners for error handling
client.on('error', (err) => {
  console.error('Redis client error:', err);
});

// Optional: Handle disconnection
client.on('end', () => {
  console.log('Redis connection closed');
});


// Function to add a job to the main queue
async function addToQueue(jobDetails) {
    try {
        await client.lPush('jobQueueList', JSON.stringify(jobDetails));
        console.log(`Job ${jobDetails.jobID} added to the queue.`);
    } catch (error) {
        console.error('Error adding job to the queue:', error);
        throw new Error('Failed to add job to queue');
    }
}

// Function to update job status
async function updateJobStatus(jobID, status, retries = null) {
  try {
      const job = await client.hGetAll(jobID);
      if (job) {
          job.status = status;
          if (retries !== null) {
              job.retries = retries; // Update retries if passed
          }
          await client.hSet(jobID, job); // Update the job in Redis
          console.log(`Job ${jobID} status updated to ${status}.`);
      } else {
          console.error(`Job ${jobID} not found for status update.`);
      }
  } catch (error) {
      console.error(`Error updating status for job ${jobID}:`, error);
      throw new Error('Failed to update job status');
  }
}


// Function to remove a job from the queue and update the count
async function decrementQueue(jobId) {
    try {
        const job = await client.hgetallAsync(jobId); // Get job details
        if (job) {
            await client.hDel('jobQueue', jobId); // Remove the job from hash
            const currentQueueCount = await client.llenAsync('jobQueueList'); // Remaining jobs in list
            console.log(`Job ${jobId} removed. Jobs left in queue: ${currentQueueCount}`);
            return {
                success: true,
                message: `Job ${jobId} removed successfully. ${currentQueueCount} jobs left.`,
            };
        } else {
            console.error(`Job ${jobId} not found in queue.`);
            return {
                success: false,
                message: `Job ${jobId} not found.`,
            };
        }
    } catch (error) {
        console.error(`Failed to remove job ${jobId} from queue:`, error);
        throw new Error('Queue operation failed');
    }
}

// Function to get the current queue length
async function getQueueLength() {
    try {
        const queueLength = await client.lLen('jobQueueList');
        console.log(`Current queue length: ${queueLength}`);
        return queueLength;
    } catch (error) {
        console.error('Error getting queue length:', error);
        throw new Error('Failed to get queue length');
    }
}

// Function to pop a job from the queue for processing
async function popFromQueue() {
    try {
        const jobString = await client.lPop('jobQueueList');
        if (jobString) {
            const job = JSON.parse(jobString); // Convert string back to object
            console.log(`Job popped from queue: ${job.jobID}`);
            return job;
        }
        console.log('No jobs available in the queue.');
        return null;
    } catch (error) {
        console.error('Error popping job from queue:', error);
        throw new Error('Failed to pop job from queue');
    }
}

module.exports = {
    client,
    addToQueue,
    decrementQueue,
    getQueueLength,
    popFromQueue,
    updateJobStatus
};
