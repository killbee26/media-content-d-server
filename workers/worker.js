const { monitorTasks } = require('../utils/taskMonitor');

const startWorker = () => {
  console.log('Worker started, monitoring tasks...');
  monitorTasks();
};

module.exports = startWorker;

