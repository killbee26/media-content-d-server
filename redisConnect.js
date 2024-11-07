const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({ url: process.env.REDIS_URL });

client.connect()
  .then(() => {
    console.log('Connected to Redis');
    return client.set('test_key', 'Hello Redis!');
  })
  .then(() => {
    return client.get('test_key');
  })
  .then((value) => {
    console.log('Value from Redis:', value);
    return client.quit();
  })
  .catch(err => {
    console.error('Redis connection error:', err);
  });
