import redisClient from '../utils/redis.js';

const rateLimit = async (req, res, next) => {
    const ip = req.ip;
    const key = `rate:${ip}`;
    
    const currentRequests = await redisClient.incr(key);
    if (currentRequests === 1) {
      await redisClient.expire(key, 60); 
    }
  
    if (currentRequests > 100) {
      return res.status(429).json({ message: 'Too many requests. Try again later.' });
    }
  
    next();
  };
  
  export default rateLimit;
  