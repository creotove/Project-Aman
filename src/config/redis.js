import { createClient } from 'redis';

const connectRedis = async () => {
  try {
    const client = createClient({
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      }
    });
    client.on('error', err => console.log('Redis Client Error', err));
    client.connect();
    console.log(`Redis client connected`);
    return client;
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};
export default connectRedis;
