const AWS = require('aws-sdk');
const ecs = new AWS.ECS({region: process.env.AWS_REGION || 'eu-north-1'});

// Function to start an ECS task for a given job
async function runEcsTask(job) {
    const params = {
        cluster: 'VideoProcessCluster',
        taskDefinition: 'ecsVideoProcessingTask',
        launchType: 'FARGATE',
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: ['subnet-0f435762c880a6d13', 'subnet-05cede512029f1c6c', 'subnet-0c77de6b56b823d05'], // Specify your subnet IDs
                securityGroups: ['sg-0682f82e955f03534', 'sg-0e1cb00cce3824587'],  // Specify your security group IDs
                assignPublicIp: 'ENABLED', // Enable public IP assignment
            },
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'videoProcessJobDocker', // The name of the container in your task definition
                    environment: [
                        {
                            name: 'S3_KEY',
                            value: job.s3Key, // Pass the S3 key to the container
                        },
                    ],
                },
            ],
        },
    };

    try {
        console.log('Starting ECS task with the following params:', params);

        // Run ECS Task
        const taskResponse = await ecs.runTask(params).promise();

        // Check for failed tasks in the response
        if (taskResponse.failures && taskResponse.failures.length > 0) {
            console.error('Failed to start ECS Task due to:', taskResponse.failures);
            throw new Error(`ECS Task failures: ${taskResponse.failures[0].reason}`);
        }

        // Ensure we have a valid taskArn in the response
        if (!taskResponse.tasks || taskResponse.tasks.length === 0) {
            throw new Error('No ECS Task started. Check the task definition and parameters.');
        }

        const taskArn = taskResponse.tasks[0].taskArn;
        console.log(`ECS Task started successfully: ${taskArn}`);
        return taskArn;
    } catch (error) {
        // Handle specific AWS ECS errors or any other unexpected errors
        if (error.code === 'InvalidParameterException') {
            console.error('Invalid parameters for ECS task:', error.message);
        } else if (error.code === 'ClusterNotFoundException') {
            console.error('ECS cluster not found:', error.message);
        } else if (error.code === 'ServiceException') {
            console.error('Internal ECS service error:', error.message);
        } else {
            console.error('Failed to start ECS Task due to unknown error:', error.message);
        }

        throw new Error(`ECS Task failed to start: ${error.message}`);
    }
}

// Function to wait for multiple ECS tasks to complete by polling their statuses
async function waitForMultipleEcsTasksCompletion(taskArns) {
    const params = {
        cluster: 'VideoProcessCluster',
        tasks: taskArns, // Pass all task ARNs to describeTasks
    };

    console.log(`Waiting for ECS tasks ${taskArns.join(', ')} to complete...`);

    let tasksCompleted = false;
    const completedTasks = new Set(); // Track completed tasks

    while (completedTasks.size < taskArns.length) {
        // Poll the status of all tasks in a single request
        const taskResponse = await ecs.describeTasks(params).promise();

        for (const task of taskResponse.tasks) {
            const taskArn = task.taskArn;
            const taskStatus = task.lastStatus;

            console.log(`ECS Task ${taskArn} status: ${taskStatus}`);

            // If the task has stopped, handle its result
            if (taskStatus === 'STOPPED' && !completedTasks.has(taskArn)) {
                const exitCode = task.containers[0].exitCode;
                if (exitCode === 0) {
                    console.log(`ECS Task ${taskArn} completed successfully.`);
                    completedTasks.add(taskArn); // Mark task as completed
                } else {
                    console.error(`ECS Task ${taskArn} failed with exit code ${exitCode}.`);
                    throw new Error(`ECS Task ${taskArn} failed.`);
                }
            }
        }

        // If not all tasks are completed, wait for a few seconds before polling again
        if (completedTasks.size < taskArns.length) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
        }
    }

    console.log(`All tasks completed: ${Array.from(completedTasks).join(', ')}`);
    return Array.from(completedTasks); // Return all completed task ARNs
}


module.exports = {
    runEcsTask,
    waitForMultipleEcsTasksCompletion
};
