import { MemorixBase } from "./MemorixBase";

const init = async () => {
  const api = new MemorixBase({
    redisUrl: process.env.REDIS_URL!,
  });
  console.log(api);
  const { get, set } = api.getCacheItem<string, string>("memo");
  set("key", "success");
  const cachedData = await get("key");
  console.log(`chached data ${cachedData}`);

  const { publish, subscribe } = api.getPubsubItemNoKey<number>("testPubSub");
  const { listen, unsubscribe } = await subscribe();
  const { asyncIterator, stop } = listen();
  const interval = setInterval(() => {
    publish(Date.now());
  }, 400);
  setTimeout(async () => {
    await unsubscribe();
    await stop();
  }, 1000);
  for await (const payload of asyncIterator) {
    console.log(`subscriber got payload ${payload}`);
  }
  console.log("out");
  clearInterval(interval);
  await api.disconnect();
};

init();
