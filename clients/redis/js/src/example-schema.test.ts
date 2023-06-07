import { Memorix, Animal } from "./example-schema.generated";

const redisUrl = process.env.REDIS_URL!;

it("example schmea will throw error if can't connect", async () => {
  const memorix = new Memorix({ redisUrl: "redis://hello-world:6379/0" });
  expect(memorix.connect()).rejects.toBeTruthy();
});

describe("example schema has", () => {
  let memorix: Memorix;
  beforeEach(async () => {
    memorix = new Memorix({ redisUrl });
    await memorix.connect();
  });
  afterEach(() => {
    memorix.disconnect();
  });
  it("cache", async () => {
    await memorix.cache.user.set("uv", { name: "uv", age: 29 });
    const user = await memorix.cache.user.get("uv");
    expect(user!.age).toBe(29);
  });
  it("cache expire from config", async () => {
    await memorix.cache.user.set("uv", { name: "uv", age: 29 });
    const user1 = await memorix.cache.user.get("uv");
    expect(user1!.age).toBe(29);
    await new Promise((res) => setTimeout(res, 2500));
    const user2 = await memorix.cache.user.get("uv");
    expect(user2).toBe(null);
  });
  it("cache expire", async () => {
    await memorix.cache.user.set(
      "uv",
      { name: "uv", age: 29 },
      { expire: { value: 1 } }
    );
    const user1 = await memorix.cache.user.get("uv");
    expect(user1!.age).toBe(29);
    await new Promise((res) => setTimeout(res, 1500));
    const user2 = await memorix.cache.user.get("uv");
    expect(user2).toBe(null);
  });
  it("cache expire in schema", async () => {
    await memorix.cache.userExpire.set("uv", { name: "uv", age: 29 });
    const user1 = await memorix.cache.userExpire.get("uv");
    expect(user1!.age).toBe(29);
    await new Promise((res) => setTimeout(res, 1500));
    const user2 = await memorix.cache.userExpire.get("uv");
    expect(user2).toBe(null);
  });
  it("cache expire none", async () => {
    await memorix.cache.userExpire2.set("uv", { name: "uv", age: 29 });
    await new Promise((res) => setTimeout(res, 2500));
    const user = await memorix.cache.userExpire2.get("uv");
    expect(user).not.toBe(null);
  });
  it("cache expire extending on get", async () => {
    await memorix.cache.userExpire3.set("uv", { name: "uv", age: 29 });
    await new Promise((res) => setTimeout(res, 1500));
    await memorix.cache.userExpire3.get("uv");
    await new Promise((res) => setTimeout(res, 1500));
    const user = await memorix.cache.userExpire3.get("uv");
    expect(user).not.toBe(null);
  });
  describe("pubsub", () => {
    it("publish says how many subscribers", (done) => {
      memorix.pubsub.message.subscribe().then(() => {
        memorix.pubsub.message
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
      memorix.pubsub.message
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
          memorix.pubsub.message.publish("hello uv");
        });
    });
    it("subscribe gets payload with AsyncIterableIterator", async () => {
      setTimeout(() => {
        memorix.pubsub.message.publish("hello uv");
      }, 500);
      const subscription = await memorix.pubsub.message.subscribe();
      for await (const payload of subscription.asyncIterator) {
        expect(payload).toBe("hello uv");
        break;
      }
      await subscription.unsubscribe();
    });
  });
  describe("task", () => {
    beforeEach(async () => {
      await memorix.task.runAlgo.clear();
      await memorix.task.runAlgoNewest.clear();
    });
    it("queue returns the queue size", async () => {
      await memorix.task.runAlgo.queue("uv1");
      const { queueSize } = await memorix.task.runAlgo.queue("uv2");
      expect(queueSize).toBe(2);
    });
    it("queue clears correctly", async () => {
      await memorix.task.runAlgo.queue("uv1");
      const { queueSize } = await memorix.task.runAlgo.queue("uv2");
      expect(queueSize).toBe(2);
      await memorix.task.runAlgo.clear();
      const { queueSize: queueSizeAfterClear } =
        await memorix.task.runAlgo.queue("uv2");
      expect(queueSizeAfterClear).toBe(1);
    });
    it("dequeue receives a message", (done) => {
      memorix.task.runAlgo
        .queue("uv3")
        .then(() => memorix.task.runAlgo.queue("uv4"))
        .then(({ queueSize }) => {
          expect(queueSize).toBe(2);

          return new Promise((res) => {
            const payloads: string[] = [];
            let stop: any;
            memorix.task.runAlgo
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
      memorix.task.runAlgo
        .queue("uv6")
        .then(() => memorix.task.runAlgo.queue("uv7"))
        .then(({ queueSize }) => {
          expect(queueSize).toBe(2);

          return new Promise((res) => {
            const payloads: string[] = [];
            let stop: any;
            memorix.task.runAlgo
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
      memorix.task.runAlgoNewest
        .queue("uv6")
        .then(() => memorix.task.runAlgoNewest.queue("uv7"))
        .then(({ queueSize }) => {
          expect(queueSize).toBe(2);

          return new Promise((res) => {
            const payloads: string[] = [];
            let stop: any;
            memorix.task.runAlgoNewest
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
      const { stop } = await memorix.task.runAlgo.dequeue(({ payload }) =>
        payload === "uv5" ? Animal.person : Animal.dog
      );
      const { getReturns } = await memorix.task.runAlgo.queue("uv5");
      const returns = await getReturns();
      expect(returns).toBe(Animal.person);
      await stop();
    });
  });
  describe("namespace", () => {
    it("works for cache item", async () => {
      await memorix.spaceship.cache.pilot.set({ name: "uv" });
      const pilot = await memorix.spaceship.cache.pilot.get();
      expect(pilot!.name).toBe("uv");
    });
    it("works for recursive cache item", async () => {
      await memorix.spaceship.crew.cache.count.set(10);
      const count = await memorix.spaceship.crew.cache.count.get();
      expect(count).toBe(10);
    });
  });
});
