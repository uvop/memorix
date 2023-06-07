import { MemorixApi, Animal } from "./example-schema.generated";

const redisUrl = process.env.REDIS_URL!;

it("example schmea will throw error if can't connect", async () => {
  const memorixApi = new MemorixApi({ redisUrl: "redis://hello-world:6379/0" });
  expect(memorixApi.connect()).rejects.toBeTruthy();
});

describe("example schema has", () => {
  let memorixApi: MemorixApi;
  beforeEach(async () => {
    memorixApi = new MemorixApi({ redisUrl });
    await memorixApi.connect();
  });
  afterEach(() => {
    memorixApi.disconnect();
  });
  it("cache", async () => {
    await memorixApi.cache.user.set("uv", { name: "uv", age: 29 });
    const user = await memorixApi.cache.user.get("uv");
    expect(user!.age).toBe(29);
  });
  it("cache expire from config", async () => {
    await memorixApi.cache.user.set("uv", { name: "uv", age: 29 });
    const user1 = await memorixApi.cache.user.get("uv");
    expect(user1!.age).toBe(29);
    await new Promise((res) => setTimeout(res, 2500));
    const user2 = await memorixApi.cache.user.get("uv");
    expect(user2).toBe(null);
  });
  it("cache expire", async () => {
    await memorixApi.cache.user.set(
      "uv",
      { name: "uv", age: 29 },
      { expire: { value: 1 } }
    );
    const user1 = await memorixApi.cache.user.get("uv");
    expect(user1!.age).toBe(29);
    await new Promise((res) => setTimeout(res, 1500));
    const user2 = await memorixApi.cache.user.get("uv");
    expect(user2).toBe(null);
  });
  it("cache expire in schema", async () => {
    await memorixApi.cache.userExpire.set("uv", { name: "uv", age: 29 });
    const user1 = await memorixApi.cache.userExpire.get("uv");
    expect(user1!.age).toBe(29);
    await new Promise((res) => setTimeout(res, 1500));
    const user2 = await memorixApi.cache.userExpire.get("uv");
    expect(user2).toBe(null);
  });
  it("cache expire none", async () => {
    await memorixApi.cache.userExpire2.set("uv", { name: "uv", age: 29 });
    await new Promise((res) => setTimeout(res, 2500));
    const user = await memorixApi.cache.userExpire2.get("uv");
    expect(user).not.toBe(null);
  });
  it("cache expire extending on get", async () => {
    await memorixApi.cache.userExpire3.set("uv", { name: "uv", age: 29 });
    await new Promise((res) => setTimeout(res, 1500));
    await memorixApi.cache.userExpire3.get("uv");
    await new Promise((res) => setTimeout(res, 1500));
    const user = await memorixApi.cache.userExpire3.get("uv");
    expect(user).not.toBe(null);
  });
  describe("pubsub", () => {
    it("publish says how many subscribers", (done) => {
      memorixApi.pubsub.message.subscribe().then(() => {
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
      let unsubscribe = (() => Promise.reject()) as () => Promise<void>;
      memorixApi.pubsub.message
        .subscribe((payload) => {
          try {
            expect(payload).toBe("hello uv");
            unsubscribe()
              .then(() => {
                done();
              })
              .catch((err) => {
                done(err);
              });
          } catch (error) {
            unsubscribe().finally(() => {
              done(error);
            });
          }
        })
        .then(({ unsubscribe: x }) => {
          unsubscribe = x;
        })
        .then(() => {
          memorixApi.pubsub.message.publish("hello uv");
        });
    });
    it("subscribe gets payload with AsyncIterableIterator", async () => {
      setTimeout(() => {
        memorixApi.pubsub.message.publish("hello uv");
      }, 500);
      const subscription = await memorixApi.pubsub.message.subscribe();
      for await (const payload of subscription.asyncIterator) {
        expect(payload).toBe("hello uv");
        break;
      }
      await subscription.unsubscribe();
    });
  });
  describe("task", () => {
    beforeEach(async () => {
      await memorixApi.task.runAlgo.clear();
      await memorixApi.task.runAlgoNewest.clear();
    });
    it("queue returns the queue size", async () => {
      await memorixApi.task.runAlgo.queue("uv1");
      const { queueSize } = await memorixApi.task.runAlgo.queue("uv2");
      expect(queueSize).toBe(2);
    });
    it("queue clears correctly", async () => {
      await memorixApi.task.runAlgo.queue("uv1");
      const { queueSize } = await memorixApi.task.runAlgo.queue("uv2");
      expect(queueSize).toBe(2);
      await memorixApi.task.runAlgo.clear();
      const { queueSize: queueSizeAfterClear } =
        await memorixApi.task.runAlgo.queue("uv2");
      expect(queueSizeAfterClear).toBe(1);
    });
    it("dequeue receives a message", (done) => {
      memorixApi.task.runAlgo
        .queue("uv3")
        .then(() => memorixApi.task.runAlgo.queue("uv4"))
        .then(({ queueSize }) => {
          expect(queueSize).toBe(2);

          return new Promise((res) => {
            const payloads: string[] = [];
            let stop: any;
            memorixApi.task.runAlgo
              .dequeue(({ payload }) => {
                payloads.push(payload);
                if (payloads.length === 2) {
                  res({
                    payloads,
                    stop,
                  });
                }
                return Animal.cat;
              })
              .then((args) => {
                stop = args.stop;
              });
          });
        })
        .then(async ({ payloads, stop }: any) => {
          expect(payloads).toStrictEqual(["uv3", "uv4"]);
          await stop();
          done();
        })
        .catch(done);
    });
    it("dequeue receives a message in opposite order if asked", (done) => {
      memorixApi.task.runAlgo
        .queue("uv6")
        .then(() => memorixApi.task.runAlgo.queue("uv7"))
        .then(({ queueSize }) => {
          expect(queueSize).toBe(2);

          return new Promise((res) => {
            const payloads: string[] = [];
            let stop: any;
            memorixApi.task.runAlgo
              .dequeue(
                ({ payload }) => {
                  payloads.push(payload);
                  if (payloads.length === 2) {
                    res({
                      payloads,
                      stop,
                    });
                  }
                  return Animal.cat;
                },
                { takeNewest: true }
              )
              .then((args) => {
                stop = args.stop;
              });
          });
        })
        .then(async ({ payloads, stop }: any) => {
          expect(payloads).toStrictEqual(["uv7", "uv6"]);
          await stop();
          done();
        })
        .catch(done);
    });
    it("dequeue receives a message in opposite order if asked from schema", (done) => {
      memorixApi.task.runAlgoNewest
        .queue("uv6")
        .then(() => memorixApi.task.runAlgoNewest.queue("uv7"))
        .then(({ queueSize }) => {
          expect(queueSize).toBe(2);

          return new Promise((res) => {
            const payloads: string[] = [];
            let stop: any;
            memorixApi.task.runAlgoNewest
              .dequeue(({ payload }) => {
                payloads.push(payload);
                if (payloads.length === 2) {
                  res({
                    payloads,
                    stop,
                  });
                }
                return Animal.cat;
              })
              .then((args) => {
                stop = args.stop;
              });
          });
        })
        .then(async ({ payloads, stop }: any) => {
          expect(payloads).toStrictEqual(["uv7", "uv6"]);
          await stop();
          done();
        })
        .catch(done);
    });
    it("queue receives a returns", async () => {
      const { stop } = await memorixApi.task.runAlgo.dequeue(({ payload }) =>
        payload === "uv5" ? Animal.person : Animal.dog
      );
      const { getReturns } = await memorixApi.task.runAlgo.queue("uv5");
      const returns = await getReturns();
      expect(returns).toBe(Animal.person);
      await stop();
    });
  });
});
