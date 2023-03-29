---
title: "Features"
date: 2020-10-06T08:49:31+00:00
lastmod: 2020-10-06T08:49:31+00:00
draft: false
images: []
menu:
  docs:
    parent: "concepts"
weight: 630
toc: true
---

We'll show the different applications you can use Memorix for, and how to do so

## Cache

Cache is the most basic use of an in-memory service, to use it simply add a line to your Cache scope in `schema.memorix`:

```
Cache {
  adminUser {
    payload: {
      email: string
      password: string
    }
  }
}
```

And to use it in your project
{{< tabs >}}
{{% tab name="Node.js" %}}

```js
await memorixApi.cache.adminUser.set({
  email: "me@mail.com",
  password: "Aa123456",
});
const adminUser = await memorixApi.cache.adminUser.get();
```

{{% /tab %}}
{{% tab name="Python" %}}

```python
from src.generated_schema import MemorixApi, CacheAdminUser

...

memorix_api.cache.adminUser.set(CacheAdminUser(email="me@mail.com", password="Aa123456"))
admin_user = memorix_api.cache.adminUser.get()

print(hello_value) # Should print "world"
```

{{% /tab %}}
{{< /tabs >}}

### Cache key

If we want to store and get multiple objects of the same kind that's also possible!

```
Cache {
  user {
    key: number
    payload: {
      email: string
      password: string
    }
  }
}
```

And to use it in your project
{{< tabs >}}
{{% tab name="Node.js" %}}

```js
await memorixApi.cache.user.set(1, {
  email: "me@mail.com",
  password: "Aa123456",
});
await memorixApi.cache.user.set(2, {
  email: "you@mail.com",
  password: "Aa123456",
});
const me = await memorixApi.cache.user.get(1);
```

{{% /tab %}}
{{% tab name="Python" %}}

```python
from src.generated_schema import MemorixApi, CacheUser

...

memorix_api.cache.user.set(
  1,
  CacheAdminUser(email="me@mail.com", password="Aa123456"),
)
memorix_api.cache.user.set(
  2,
  CacheAdminUser(email="you@mail.com", password="Aa123456"),
)
me = memorix_api.cache.adminUser.get(1)

print(hello_value) # Should print "world"
```

{{% /tab %}}
{{< /tabs >}}

> Key can be any type you like, even a nested object

### Cache options

You can define cache options or override them within your usage - either from schema or your code (preferably schema)

{{< tabs >}}
{{% tab name="Schema" %}}

Global cache options and overriden cache options

```
Config {
  defaultOptions: {
    cache: {
      expire: {
        value: 5
      }
    }
  }
}

Cache {
    hello {
        payload: string
        options: {
          expire: {
            value: 10
          }
        }
    }
    helloForever {
        payload: string
        options: {
          expire: null
        }
    }
}
```

{{% /tab %}}
{{% tab name="Node.js" %}}

```js
// Global cache options
const memorixApi = new MemorixApi({
  redisUrl: "redis://localhost:6379/0",
  defaults: {
    cacheSetOptions: { ... }
  },
});

// Overriden cache options
await memorixApi.cache.hello.set(
  "world",
  { ... }
);
```

{{% /tab %}}
{{% tab name="Python" %}}

```python
from src.generated_schema import (
  MemorixApi,
  MemorixClientApiDefaults,
  MemorixClientCacheSetOptions,
)

# Global cache options
memorix_api = MemorixApi(
  redis_url="redis://localhost:6379/0",
  defaults=MemorixClientApiDefaults(
    cache_set_options=MemorixClientCacheSetOptions(...),
  ),
)

# Overriden cache options
memorix_api.cache.hello.set(
  "world",
  MemorixClientCacheSetOptions(...),
)
```

{{% /tab %}}
{{< /tabs >}}

| name   | Type                                | Default       | Description                                                                                    |
| :----- | :---------------------------------- | :------------ | :--------------------------------------------------------------------------------------------- |
| expire | `object` | `null` - No expiration | Expiration options for the cache item |
| expire.value | `int` | Required | The numerical value of how many seconds (or milliseconds) until the data is expired and can be deleted from the cache |
| expire.isInMs | `boolean` | `false` | Whatever the `expire.value` is in seconds or milliseconds, not setting this will make it in seconds |
| expire.extendOnGet | `boolean` | `false` | If is set to true, the item's expiration will be reset |

## PubSub

PubSub (short for publish and subscribe) is a feature used to broadcast messages from one publisher to many subscribers.  
Unlike [`Cache`](#cache), the message isn't saved anywhere and is just passed along.  
To use it simply add a line to your PubSub scope in `schema.memorix`:

```
PubSub {
  message {
    payload: string
  }
}
```

And to use it in your project
{{< tabs >}}
{{% tab name="Node.js" %}}

```js
await { stop } = memorixApi.pubsub.message.subscribe(({ payload }) => {
  // Will be called twice with "hello" then "world"
  console.log("Got payload: " + payload);
});
await memorixApi.pubsub.message.publish("hello");
await memorixApi.pubsub.message.publish("world");
await stop();
await memorixApi.pubsub.message.publish("Will be published but no one is listening");
```

You can also subscribe to an [`Async iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of) if you don't pass a callback

```js
for await (const { payload } of memorixApi.pubsub.message.subscribe()) {
  console.log("Got payload: " + payload);
}
```

{{% /tab %}}
{{% tab name="Python" %}}
To use python pubsub, you need to subscribe on a `Thread` or a `Process` since it's a blocking code, for example

```python
import multiprocessing

def listen_to_message() -> None:
    for res in memorix_api.pubsub.message.subscribe():
        # Will be called twice with "hello" then "world"
        print("Got payload: ", res.payload)

process = multiprocessing.Process(target=listen_to_message)

memorix_api.pubsub.message.publish(payload="hello")
memorix_api.pubsub.message.publish(payload="world")

process1.kill()

memorix_api.pubsub.message.publish(payload="Will be published but no one is listening")
```

{{% /tab %}}
{{< /tabs >}}

### PubSub key

PubSub also supports key the same as [`Cache`](#cache) supports it, you can use it to publish a message to a specific subscriber or a group.

## Task

Task is the last feature Memorix supports, it sends a message to a specific queue, and one of the listeners picks it up.

> Unlike [`PubSub`](#pubsub), even if no one is listening to a queue, it's saved and will be passed to a single listener once it starts listening.

To use it simply add a line to your Task scope in `schema.memorix`:

```
Task {
  addMessage {
    payload: string
  }
}
```

And to use it in your project
{{< tabs >}}
{{% tab name="Node.js" %}}

```js
await memorixApi.task.addMessage.queue("hello");
await memorixApi.task.addMessage.queue("world");
await { stop } = memorixApi.task.addMessage.dequeue(async ({ payload }) => {
  // Will be called twice with "hello" then "world"
  console.log("Got payload: " + payload);

  // To stop listening, just for example
  if (payload === "world") {
    await stop();
  }
});

// Clears queue
await memorix_api.task.addMessage.clear();
```

{{% /tab %}}
{{% tab name="Python" %}}

> You might want to consider also using a `Thread` or a `Process` just like we did with [`PubSub`](#pubsub), this example won't do that

```python

memorix_api.task.addMessage.queue(payload="hello")
memorix_api.task.addMessage.queue(payload="world")

for res in memorix_api.task.addMessage.dequeque():
    # Will be called twice with "hello" then "world"
    print("Got payload: ", res.payload)

    # To stop listening, just for example
    if res.payload == "world"
      break

# Clears queue
memorix_api.task.addMessage.clear()
```

{{% /tab %}}
{{< /tabs >}}

### Task key

Task also supports key the same as [`Cache`](#cache) and [`PubSub`](#pubsub) support it, you can use put messages in different queues.

### Task retuns

Since Task sends a message from a single machine to another, we also support sending a response back to the original sender!
To use it simply add `returns` to your specific `Task`

```
Task {
  addMessage {
    payload: string
    returns: boolean
  }
}
```

And to use it in your project
{{< tabs >}}
{{% tab name="Node.js" %}}

```js
memorixApi.task.addMessage.dequeue(async ({ payload }) => {
  console.log("Got payload: " + payload);

  return true;
});

const { getReturns } = await memorixApi.task.addMessage.queue("hello");

const isAddSuccessful = await getReturns();

console.log(isAddSuccessful); // Should print "true"
```

{{% /tab %}}
{{% tab name="Python" %}}

```python
def listen_to_message() -> None:
    for res in memorix_api.task.addMessage.dequeque():
        print("Got payload: ", res.payload)

        res.send_returns(returns=True)

process = multiprocessing.Process(target=listen_to_message)

queue = memorix_api.task.addMessage.queue(payload="hello")

res = queue.get_returns()

print(res.value) # Should print "true"

```

{{% /tab %}}
{{< /tabs >}}

### Task options

You can define task options or override them within your usage - either from schema or your code (preferably schema)

{{< tabs >}}
{{% tab name="Schema" %}}

Global task options and overriden task options

```
Config {
  defaultOptions: {
    task: {
      takeNewest: false
    }
  }
}

Task {
  addMessage {
    payload: string
    returns: boolean
    options: {
      takeNewest: true
    }
  }
}
```

{{% /tab %}}
{{% tab name="Node.js" %}}

```js
// Global task options
const memorixApi = new MemorixApi({
  redisUrl: "redis://localhost:6379/0",
  defaults: {
    taskDequequeOptions: { ... }
  },
});

// Overriden task options
await { stop } = memorixApi.task.addMessage.dequeue(async ({ payload }) => {
  console.log("Got payload: " + payload);
}, { ... });
```

{{% /tab %}}
{{% tab name="Python" %}}

```python
from src.generated_schema import (
  MemorixApi,
  MemorixClientApiDefaults,
  MemorixClientTaskDequeueOptions,
)

# Global task options
memorix_api = MemorixApi(
  redis_url="redis://localhost:6379/0",
  defaults=MemorixClientApiDefaults(
    task_dequeue_options=MemorixClientTaskDequeueOptions(...),
  ),
)

# Overriden task options
for res in memorix_api.task.addMessage.dequeque(MemorixClientTaskDequeueOptions(...)):
    print("Got payload: ", res.payload)
```

{{% /tab %}}
{{< /tabs >}}

| name       | Type      | Default | Description                                                              |
| :--------- | :-------- | :------ | :----------------------------------------------------------------------- |
| takeNewest | `boolean` | False   | By default dequeque is FIFO (first in first out), this option changes it |
