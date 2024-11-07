const { spawn } = require('child_process');
const path = require('path');

const pollerProcess = spawn('node', [path.join(__dirname, '../utils/ecsPoller.js')], {
    detached: true, // This allows the child process to run independently
    stdio: 'inherit' // Inherit stdio to show logs in the new terminal
});

// Unreference the child process so that it can continue to run independently
pollerProcess.unref();

console.log('ECS Poller started in a separate terminal.');
