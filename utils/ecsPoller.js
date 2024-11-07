// ecsPoller.js

const { waitForMultipleEcsTasksCompletion } = require('../services/ecsService');

process.on('message', async (message) => {
    if (message.taskArns) {
        console.log("Received taskArns:", message.taskArns);

        // Process each taskArn (you can implement your logic here)
        try {
            await waitForMultipleEcsTasksCompletion(message.taskArns);
            console.log('All ECS tasks completed successfully.');
        } catch (error) {
            console.error('Error waiting for ECS tasks to complete:', error);
        }
    }
});

// Notify the parent process that the poller is ready
process.send({ status: 'ready' });

// Polling logic here
const pollEcsTasks = () => {
    // Implement your polling logic
    setInterval(() => {
        // Check for new ECS tasks
        console.log("ECS Poller: No new ECS tasks to poll, waiting for incoming tasks...");
    }, 5000); // Adjust the interval as needed
};

// Start the polling logic
pollEcsTasks();
