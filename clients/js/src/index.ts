import { BaseMemorixApi } from "./BaseMemorixApi";

const init = async () => {
  const api = new BaseMemorixApi();
  const { get, set } = api.getCacheItem<string, string>("memo");
  set("key", "success");
  const cachedData = await get("key");
  console.log(`chached data ${cachedData}`);

  const { publish, subscribe } = api.getPubsubItem<undefined, number>(
    "testPubSub"
  );
  subscribe((payload) => {
    console.log(`subscriber got payload ${payload}`);
  });

  setInterval(() => {
    publish(Date.now());
  }, 400);
};

init();

export { BaseMemorixApi };
