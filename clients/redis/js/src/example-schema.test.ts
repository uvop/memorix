import { MemorixApi, Animal } from "./example-schema.generated";

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
  describe("pubsub", () => {
    it("publish says how many subscribers", (done) => {
      memorixApi.pubsub.message
        .subscribe(() => {})
        .then(() => {
          memorixApi.pubsub.message
            .publish("hello uv")
            .then(({ subscribersSize }) => {
              try {
                expect(subscribersSize).toBe(1);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });
    it("subscribe gets payload", (done) => {
      memorixApi.pubsub.message
        .subscribe(({ payload }) => {
          try {
            expect(payload).toBe("hello uv");
            done();
          } catch (error) {
            done(error);
          }
        })
        .then(() => {
          memorixApi.pubsub.message.publish("hello uv");
        });
    });
  });
  describe("task", () => {
    beforeEach(async () => {
      const { stop } = await memorixApi.task.runAlgo.dequeue(() => {
        return Animal.dog;
      });
      await new Promise((res) => setTimeout(res, 100));
      await stop();
    });
    it("queue returns the queue size", async () => {
      await memorixApi.task.runAlgo.queue("uv1");
      const { queueSize } = await memorixApi.task.runAlgo.queue("uv2");
      expect(queueSize).toBe(2);
    });
    it("dequeue receives a message", (done) => {
      memorixApi.task.runAlgo
        .queue("uv3")
        .then(async () => {
          const { stop } = await memorixApi.task.runAlgo.dequeue(
            ({ payload }) => {
              try {
                expect(payload).toBe("uv3");
                done();
              } catch (error) {
                done(error);
              }
              return Animal.cat;
            }
          );
          await new Promise((res) => setTimeout(res, 100));
          await stop();
        })
        .catch(done);
    });
    it("queue receives a returns", async () => {
      const { stop } = await memorixApi.task.runAlgo.dequeue(({ payload }) =>
        payload === "uv4" ? Animal.person : Animal.dog
      );
      const { getReturns } = await memorixApi.task.runAlgo.queue("uv4");
      const returns = await getReturns();
      expect(returns).toBe(Animal.person);
      await stop();
    });
  });
});
