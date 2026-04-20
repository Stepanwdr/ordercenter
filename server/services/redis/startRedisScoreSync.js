import redis from "./redis.js";
import { Users } from "../../models/index.js";

export const startRedisScoreSync = (io) => {

  setInterval(async () => {
    try {
      const keys = await redis.keys("coin:*");

      for (const key of keys) {
        const tgUserId = key.split(":")[1];
        const score = parseInt(await redis.get(key), 10);
        if (score) {
           await redis.del(key);
           await Users.increment("coin", { by: score * 10, where: { tgUserId } });
           const user = await Users.findOne({ where: { tgUserId } });

          if(user){
            // Отправляем актуальный счёт клиенту
            io.to(tgUserId).emit("scoreUpdated", { coin: user.dataValues.coin });
          }
        }
      }
      console.log("Сброс coin из Redis в БД завершён");
    } catch (error) {
      console.error("Ошибка сброса coin из Redis:", error);
    }
  }, 5000);
};
