import { MemorixBase } from "./MemorixBase";

class Memorix extends MemorixBase {
  protected namespaceNameTree = [];

  cache = {
    memo: this.getCacheItem<string, string>("memo"),
  };

  pubsub = {
    testPubSub: this.getPubsubItemNoKey<number>("testPubSub"),
  };
}

const init = async () => {
  const memorix = new Memorix({
    redisUrl: process.env.REDIS_URL!,
  });
  await memorix.connect();
  memorix.cache.memo.set("key", "success");
  const cachedData = await memorix.cache.memo.get("key");
  console.log(`chached data ${cachedData}`);

  const { asyncIterator, unsubscribe } =
    await memorix.pubsub.testPubSub.subscribe();
  const interval = setInterval(() => {
    memorix.pubsub.testPubSub.publish(Date.now());
  }, 400);
  setTimeout(async () => {
    await unsubscribe();
  }, 1000);
  for await (const payload of asyncIterator) {
    console.log(`subscriber got payload ${payload}`);
  }
  console.log("out");
  clearInterval(interval);
  await memorix.disconnect();
};

init();
