const { runEcsTask, waitForMultipleEcsTasksCompletion } = require('../services/ecsService');
const { getQueueLength, popFromQueue, addToQueue, updateJobStatus } = require('../services/redisService');

const { fork } = require('child_process');
const MAX_CONCURRENT_TASKS = 5;
let runningTasks = 0;
const MAX_RETRIES = 3;
const path = require('path');

let ecsPoller; // Declare the poller globally
let isPollerReady = false; // Flag to track poller readiness

const startEcsPoller = () => {
    ecsPoller = fork(path.join(__dirname, '../utils/ecsPoller.js'));

    ecsPoller.on('message', (message) => {
        if (message.status === 'ready') {
            console.log('[Main Server] ECS Poller is confirmed as ready.');
            isPollerReady = true; // Set the poller as ready
        } else {
            console.log('[Main Server] ECS Poller Log:', message);
        }
    });

    ecsPoller.on('error', (error) => {
        console.error('[Main Server] ECS Poller Error:', error);
    });

    ecsPoller.on('exit', (code) => {
        console.log(`[Main Server] ECS Poller exited with code ${code}, restarting...`);
        startEcsPoller(); // Restart the poller if it exits
    });
};

// Start the ECS Poller
startEcsPoller();

const processQueue = async () => {
    try {
        console.log("Running queue check...");
        const queueLength = await getQueueLength();

        if (queueLength > 0 && runningTasks < MAX_CONCURRENT_TASKS) {
            const jobsToProcess = Math.min(queueLength, MAX_CONCURRENT_TASKS - runningTasks);
            const taskArns = [];
            const jobIDs = [];

            for (let i = 0; i < jobsToProcess; i++) {
                const job = await popFromQueue();

                if (job) {
                    runningTasks++;
                    console.log(`Processing job with S3 key: ${job.s3Key}`);

                    // Update job status to "in-progress"
                    await updateJobStatus(job.jobID, 'in-progress');

                    try {
                        // Run ECS task and store its taskArn
                        const taskArn = await runEcsTask(job);
                        taskArns.push(taskArn);
                        jobIDs.push(job.jobID);
                    } catch (error) {
                        runningTasks--;
                        handleJobFailure(job, error);
                    }
                }
            }

            // Poll for ECS task completion for all running tasks
            if (taskArns.length > 0) {
                try {
                  console.log('Sending taskArns to ECS Poller:', taskArns);
                  if(isPollerReady){
                    ecsPoller.send({taskArns});
                  }else{
                    console.log("poller is not connected")
                  }

                    // Mark all jobs as completed when tasks finish
                    for (const jobID of jobIDs) {
                        await updateJobStatus(jobID, 'completed');
                        console.log(`Task completed for job: ${jobID}, Running tasks: ${--runningTasks}`);
                    }
                } catch (error) {
                    console.error("Error while waiting for ECS tasks to complete:", error);
                }
            }
        }
    } catch (error) {
        console.error("Error processing queue:", error);
    }
};

// Function to handle job failure and retry logic
const handleJobFailure = async (job, error) => {
    job.retries = (job.retries || 0) + 1; // Increment retry count

    if (job.retries < MAX_RETRIES) {
        console.error(`Job ${job.jobID} failed, retrying... (Attempt ${job.retries})`);
        await updateJobStatus(job.jobID, 'pending', job.retries);
        await addToQueue(job); // Requeue the job for retry
    } else {
        await updateJobStatus(job.jobID, 'failed'); // Mark as failed after max retries
        console.error(`Failed to process job ${job.jobID} after ${MAX_RETRIES} attempts.`);
    }
};

module.exports = { processQueue };
