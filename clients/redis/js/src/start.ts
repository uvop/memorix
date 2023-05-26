import { MemorixBase } from "./MemorixBase";

const init = async () => {
  const api = new MemorixBase({
    redisUrl: process.env.REDIS_URL!,
  });
  console.log(api);
  // const { get, set } = api.getCacheItem<string, string>("memo");
  // set("key", "success");
  // const cachedData = await get("key");
  // console.log(`chached data ${cachedData}`);

  // const { publish, subscribe } = api.getPubsubItemNoKey<number>("testPubSub");
  // subscribe((payload) => {
  //   console.log(`subscriber got payload ${payload}`);
  // });

  // setInterval(() => {
  //   publish(Date.now());
  // }, 400);
};

init();
