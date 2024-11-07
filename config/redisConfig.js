const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL); // e.g., redis://localhost:6379

module.exports = redis;
