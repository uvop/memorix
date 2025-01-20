// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertNotEquals } from "jsr:@std/assert";
import { Animal, Memorix } from "./example-schema.generated.ts";

const memorix = new Memorix();
await memorix.connect();

Deno.test("simple cache", async () => {
  await memorix.cache.user.set("uv", { name: "uv", age: 29 });
  const user = await memorix.cache.user.get("uv");
  assertEquals(user!.age, 29);
});
Deno.test // .ignore
("cache expire in schema", async () => {
  await memorix.cache.userExpire.set("uv", { name: "uv", age: 29 });
  const user1 = await memorix.cache.userExpire.get("uv");
  assertEquals(user1!.age, 29);
  await new Promise((res) => setTimeout(res, 1500));
  const user2 = await memorix.cache.userExpire.get("uv");
  assertEquals(user2, null);
});
Deno.test // .ignore
("cache expire none", async () => {
  await memorix.cache.userExpire2.set("uv", { name: "uv", age: 29 });
  await new Promise((res) => setTimeout(res, 2500));
  const user = await memorix.cache.userExpire2.get("uv");
  assertNotEquals(user, null);
});
Deno.test // .ignore
("cache expire extending on get", async () => {
  await memorix.cache.userExpire3.set("uv", { name: "uv", age: 29 });
  await new Promise((res) => setTimeout(res, 1500));
  await memorix.cache.userExpire3.get("uv");
  await new Promise((res) => setTimeout(res, 1500));
  const user = await memorix.cache.userExpire3.get("uv");
  assertNotEquals(user, null);
});
Deno.test // .ignore
("cache expire extending manually", async () => {
  await memorix.cache.userNoKey.set({ name: "uv", age: 29 });
  await new Promise((res) => setTimeout(res, 1500));
  await memorix.cache.userNoKey.get();
  await memorix.cache.userNoKey.extend();
  await new Promise((res) => setTimeout(res, 1500));
  const user = await memorix.cache.userNoKey.get();
  assertNotEquals(user, null);
});
Deno.test(
  "publish says how many subscribers",
  () =>
    new Promise((res, rej) => {
      memorix.pubsub.message.subscribe().then(() => {
        memorix.pubsub.message
          .publish("hello uv")
          .then(({ subscribersSize }) => {
            try {
              assertEquals(subscribersSize, 1);
              res();
            } catch (error) {
              rej(error);
            }
          });
      });
    }),
);
Deno.test(
  "publish says how many subscribers",
  () =>
    new Promise((res, rej) => {
      let unsubscribe = (() => Promise.reject()) as () => Promise<void>;
      memorix.pubsub.message
        .subscribe((payload) => {
          try {
            assertEquals(payload, "hello uv");
            unsubscribe()
              .then(() => {
                res();
              })
              .catch((err) => {
                rej(err);
              });
          } catch (error) {
            unsubscribe().finally(() => {
              rej(error);
            });
          }
        })
        .then(({ unsubscribe: x }) => {
          unsubscribe = x;
        })
        .then(() => {
          memorix.pubsub.message.publish("hello uv");
        });
    }),
);
Deno.test("subscribe gets payload with AsyncIterableIterator", async () => {
  setTimeout(() => {
    memorix.pubsub.message.publish("hello uv");
  }, 500);
  const subscription = await memorix.pubsub.message.subscribe();
  for await (const payload of subscription.asyncIterator) {
    assertEquals(payload, "hello uv");
    break;
  }
  await subscription.unsubscribe();
});

const beforeTask = async () => {
  await memorix.task.runAlgo.empty();
  await memorix.task.runAlgoNewest.empty();
};

Deno.test("queue returns the queue size", async () => {
  await beforeTask();
  await memorix.task.runAlgo.enqueue("uv1");
  const { queueSize } = await memorix.task.runAlgo.enqueue("uv2");
  assertEquals(queueSize, 2);
});
Deno.test("queue clears correctly", async () => {
  await beforeTask();
  await memorix.task.runAlgo.enqueue("uv1");
  const { queueSize } = await memorix.task.runAlgo.enqueue("uv2");
  assertEquals(queueSize, 2);
  await memorix.task.runAlgo.empty();
  const { queueSize: queueSizeAfterClear } = await memorix.task.runAlgo
    .enqueue("uv2");
  assertEquals(queueSizeAfterClear, 1);
});
Deno.test("dequeue receives a message", async () => {
  await beforeTask();
  const p = new Promise((res, rej) => {
    memorix.task.runAlgo
      .enqueue("uv3")
      .then(() => memorix.task.runAlgo.enqueue("uv4"))
      .then(({ queueSize }) => {
        assertEquals(queueSize, 2);

        return new Promise((res) => {
          const payloads: string[] = [];
          let stop: any;
          memorix.task.runAlgo
            .dequeue((payload) => {
              payloads.push(payload);
              if (payloads.length === 2) {
                res({
                  payloads,
                  stop,
                });
              }
            })
            .then((args) => {
              stop = args.stop;
            });
        });
      })
      .then(async ({ payloads, stop }: any) => {
        assertEquals(payloads, ["uv3", "uv4"]);
        await stop();
        res(undefined);
      })
      .catch(rej);
  });
  await p;
});
Deno.test(
  "dequeue receives a message in opposite order if asked from schema",
  async () => {
    await beforeTask();
    const p = new Promise((res, rej) => {
      memorix.task.runAlgoNewest
        .enqueue("uv6")
        .then(() => memorix.task.runAlgoNewest.enqueue("uv7"))
        .then(({ queueSize }) => {
          assertEquals(queueSize, 2);

          return new Promise((res) => {
            const payloads: string[] = [];
            let stop: any;
            memorix.task.runAlgoNewest
              .dequeue((payload) => {
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
          assertEquals(payloads, ["uv7", "uv6"]);
          await stop();
          res(undefined);
        })
        .catch(rej);
    });
    await p;
  },
);
Deno.test("namespace works for cache item", async () => {
  await memorix.spaceship.cache.pilot.set({ name: "uv" });
  const pilot = await memorix.spaceship.cache.pilot.get();
  assertEquals(pilot!.name, "uv");
});
Deno.test("namespace works for recursive cache item", async () => {
  await memorix.spaceship.crew.cache.count.set(10);
  const count = await memorix.spaceship.crew.cache.count.get();
  assertEquals(count, 10);
});
Deno.test("cache with optional payload", async () => {
  await memorix.cache.optionalPayload.set(undefined);
  const payload = await memorix.cache.optionalPayload.get();
  assertEquals(payload, null);
});
