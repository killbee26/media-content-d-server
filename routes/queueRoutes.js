const express = require('express');
// const { addJob, getJob, getQueueLength } = require('../controllers/jobController');
const { addJob } = require('../controllers/jobController');
const router = express.Router();

router.post('/add', addJob);          // Route to manually add a job to the queue
// router.get('/next', getJob);           // Route to get the next job from the queue
// router.get('/length', getQueueLength); // Route to check the queue length

module.exports = router;
