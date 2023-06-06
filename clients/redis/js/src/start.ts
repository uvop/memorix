import { MemorixBaseApi } from "./MemorixBaseApi";

const init = async () => {
  const api = new MemorixBaseApi({
    redisUrl: process.env.REDIS_URL!,
  });
  const { get, set } = api.getCacheItem<string, string>("memo");
  set("key", "success");
  const cachedData = await get("key");
  console.log(`chached data ${cachedData}`);

  const { publish, subscribe } = api.getPubsubItemNoKey<number>("testPubSub");
  const { listen, stop } = await subscribe();
  const interval = setInterval(() => {
    publish(Date.now());
  }, 400);
  setTimeout(() => {
    stop();
  }, 1000);
  for await (const payload of listen()) {
    console.log(`subscriber got payload ${payload}`);
  }
  console.log("out");
  clearInterval(interval);
  await api.disconnect();
};

init();
