import Redis from "ioredis";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
});
redis.on("connect", () => {
  console.log("Redis подключён ✅");
});

redis.on("error", (err) => {
  console.error("Redis ошибка:", err);
});
export default redis;