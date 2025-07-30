// redis.ts
import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "13255"),
  },
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

redisClient.on("ready", () => {
  console.log("Redis connected successfully!");
});

export const connect = async () => {
  if (!redisClient.isOpen) {
    console.log(process.env.REDIS_HOST);
    await redisClient.connect();
  }
};

export default redisClient;
