import { MemorixApi } from "./example-schema.generated";

const redisUrl = process.env.REDIS_URL!;

describe("example schema has", () => {
  let memorixApi: MemorixApi;
  beforeEach(() => {
    memorixApi = new MemorixApi({ redisUrl });
  });
  afterEach(() => {
    memorixApi.disconnect();
  });
  it("cache", async () => {
    await memorixApi.cache.user.set("uv", { name: "uv", age: 29 });
    const user = await memorixApi.cache.user.get("uv");
    expect(user!.age).toBe(29);
  });
  it("pubsub", (done) => {
    memorixApi.pubsub.message.subscribe((message) => {
      try {
        expect(message).toBe("hello uv");
      } catch (error) {
        done(error);
      }
    });
    setTimeout(() => {
      memorixApi.pubsub.message.publish("hello uv");
    }, 500);
  });
});
