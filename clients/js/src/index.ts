import { BaseMemorixApi } from "./BaseMemorixApi";

const init = async () => {
  const api = new BaseMemorixApi();
  const { get, set } = api.getCacheItem<string, string>("memo");
  set("key", "success");

  const data = await get("key");
  console.log(data);
};

init();

export { BaseMemorixApi };
