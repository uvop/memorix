import { Namespace } from "./namespace";

const init = async () => {
  const api = new Namespace({
    redisUrl: process.env.REDIS_URL!,
  });
  const { get, set } = api.getCacheItem<string, string>("memo");
  set("key", "success");
  const cachedData = await get("key");
  console.log(`chached data ${cachedData}`);

  const { publish, subscribe } = api.getPubsubItemNoKey<number>("testPubSub");
  subscribe((payload) => {
    console.log(`subscriber got payload ${payload}`);
  });

  setInterval(() => {
    publish(Date.now());
  }, 400);
};

init();
