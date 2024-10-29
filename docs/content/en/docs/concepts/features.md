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
  adminUser: {
    payload: {
      email: string
      password: string
    }
  }
}
```

And to use it in your project
{{< tabs >}}
{{% tab name="Javascript" %}}

```js
await memorix.cache.adminUser.set({
  email: "me@mail.com",
  password: "Aa123456",
});
const adminUser = await memorix.cache.adminUser.get();
```

{{% /tab %}}
{{% tab name="Python" %}}

```python
from src.generated_schema import Memorix, CacheAdminUser

...

memorix.cache.adminUser.set(CacheAdminUser(email="me@mail.com", password="Aa123456"))
admin_user = memorix.cache.adminUser.get()
```

{{% /tab %}}
{{% tab name="Rust" %}}

```rust
memorix.cache.adminUser.set(
  memorix_generated::CacheAdminUser {
    email: "me@mail.com".to_string(),
    password: "Aa123456".to_string(),
  }
).await?;
let admin_user = memorix.cache.adminUser.get().await?;
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
{{% tab name="Javascript" %}}

```js
await memorix.cache.user.set(1, {
  email: "me@mail.com",
  password: "Aa123456",
});
await memorix.cache.user.set(2, {
  email: "you@mail.com",
  password: "Aa123456",
});
const me = await memorix.cache.user.get(1);
```

{{% /tab %}}
{{% tab name="Python" %}}

```python
from src.generated_schema import Memorix, CacheUser

...

memorix.cache.user.set(
  1,
  CacheAdminUser(email="me@mail.com", password="Aa123456"),
)
memorix.cache.user.set(
  2,
  CacheAdminUser(email="you@mail.com", password="Aa123456"),
)
me = memorix.cache.adminUser.get(1)
```

{{% /tab %}}
{{% tab name="Rust" %}}

```rust
memorix.cache.user.set(
  &1,
  memorix_generated::CacheAdminUser {
    email: "me@mail.com".to_string(),
    password: "Aa123456".to_string(),
  },
).await?;
memorix.cache.user.set(
  &2,
  memorix_generated::CacheAdminUser {
    email: "you@mail.com".to_string(),
    password: "Aa123456",
  },
).await?;
let me = memorix.cache.adminUser.get(&1).await?;
```

{{% /tab %}}
{{< /tabs >}}

> Key can be any type you like, even a nested object

### Cache options

You can define cache options in your schema to change it's behaviour

```
Cache {
    hello {
        payload: string
        ttl: "10"
    }
    helloForever {
        payload: string
        ttl: "0"
    }
}
```

Here to defined that each cache item will expire in 5 seconds, but specifically `hello` will expire in 10 seconds and `helloForever` won't expire.

| name          | Type                  | Default               | Description                                                                                                                |
| :------------ | :-------------------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| ttl           | `string or env value` | `"0"` - No expiration | The numerical value of how many seconds until the data is expired and can be deleted from the cache, `0` for no expiration |
| extend_on_get | `string or env value` | `"false"`             | If is set to true, the item's expiration will be reset each time `get` api is called                                       |

## PubSub

PubSub (short for publish and subscribe) is a feature used to broadcast messages from one publisher to many subscribers.  
Unlike [`Cache`](#cache), the message isn't saved anywhere and is just passed along.  
To use it simply add a line to your PubSub scope in `schema.memorix`:

```
PubSub {
  message: {
    payload: string
  }
}
```

And to use it in your project
{{< tabs >}}
{{% tab name="Javascript" %}}

```js
await { stop } = memorix.pubsub.message.subscribe(({ payload }) => {
  // Will be called twice with "hello" then "world"
  console.log("Got payload: " + payload);
});
await memorix.pubsub.message.publish("hello");
await memorix.pubsub.message.publish("world");
await stop();
await memorix.pubsub.message.publish("Will be published but no one is listening");
```

You can also subscribe to an [`Async iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of) if you don't pass a callback

```js
const subscription = await memorix.pubsub.message.subscribe();
for await (const payload of subscription.asyncIterator) {
  console.log("Got payload: " + payload);
}
```

{{% /tab %}}
{{% tab name="Python" %}}
To use python pubsub, you need to subscribe on a `Thread` or a `Process` since it's a blocking code, for example

```python
import multiprocessing

def listen_to_message() -> None:
    for payload in memorix.pubsub.message.subscribe():
        # Will be called twice with "hello" then "world"
        print("Got payload: ", payload)

process = multiprocessing.Process(target=listen_to_message)

memorix.pubsub.message.publish(payload="hello")
memorix.pubsub.message.publish(payload="world")

process1.kill()

memorix.pubsub.message.publish(payload="Will be published but no one is listening")
```

{{% /tab %}}
{{% tab name="Rust" %}}
To use rust pubsub, you need to subscribe on a different async function, for example

```rust
extern crate tokio;
extern crate futures_util;

use futures_util::StreamExt;

async fn listen_to_message(
    mut memorix: example_schema_generated::Memorix,
) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
  let subscription = memorix.pubsub.message.subscribe().await?
  loop {
    let payload = subscription
      .next()
      .await
      .expect("Subscription shouldn't end")?;
    println!("Got payload: {}", payload);
  }
  Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
  let mut memorix = example_schema_generated::Memorix::new("redis://localhost:6379/0").await?;

  let futures_v: Vec<
      std::pin::Pin<
          Box<dyn std::future::Future<Output = Result<(), Box<dyn std::error::Error + Sync + Send>>>>,
      >,
  > = vec![
    Box::pin(listen_to_message(memorix.clone())),
    Box::pin(async move {
      memorix.pubsub.message.publish(&"hello".to_string()).await?;
      memorix.pubsub.message.publish(&"world".to_string()).await?;
      Ok(())
    }),
  ];

  futures::future::select_all(futures_v).await.0?; // Run until one is complete
  memorix.pubsub.message.publish(&"Will be published but no one is listening".to_string()).await?;

  Ok(())
}
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
  addMessage: {
    payload: string
  }
}
```

And to use it in your project
{{< tabs >}}
{{% tab name="Javascript" %}}

```js
await memorix.task.addMessage.queue("hello");
await memorix.task.addMessage.queue("world");
await { stop } = memorix.task.addMessage.dequeue(async (payload) => {
  // Will be called twice with "hello" then "world"
  console.log("Got payload: " + payload);

  // To stop listening, just for example
  if (payload === "world") {
    await stop();
  }
});

// Emptys queue
await memorix.task.addMessage.empty();
```

{{% /tab %}}
{{% tab name="Python" %}}

> You might want to consider also using a `Thread` or a `Process` just like we did with [`PubSub`](#pubsub), this example won't do that

```python

memorix.task.addMessage.queue(payload="hello")
memorix.task.addMessage.queue(payload="world")

for res in memorix.task.addMessage.dequeque():
    # Will be called twice with "hello" then "world"
    print("Got payload: ", res.payload)

    # To stop listening, just for example
    if res.payload == "world"
      break

# Emptys queue
memorix.task.addMessage.empty()
```

{{% /tab %}}
{{% tab name="Rust" %}}

```rust
memorix
        .task
        .pass_ball
        .addMessage
        .enqueue(&"hello".to_string())
        .await?;
memorix
        .task
        .pass_ball
        .addMessage
        .enqueue(&"world".to_string())
        .await?;

let mut async_iterator = memorix
    .task
    .addMessage
    .dequeue()
    .await?;

loop {
    let payload = async_iterator
        .next()
        .await
        .ok_or("Async Iterator shouldn't end")??;

    if payload == "world" {
      break;
    }
}
memorix.task.addMessage.empty().await?;
```

{{% /tab %}}
{{< /tabs >}}

### Task key

Task also supports key the same as [`Cache`](#cache) and [`PubSub`](#pubsub) support it, you can use put messages in different queues.

### Task options

You can define task options globally or per task item in your schema to change it's behaviour

```
Task {
  addMessage {
    payload: string
    queue_type: env(QUEUE_TYPE)
  }
}
```

| name       | Type                  | Default  | Description                                           |
| :--------- | :-------------------- | :------- | :---------------------------------------------------- |
| queue_type | `string or env value` | `"fifo"` | fifo (first in first out) or lifo (last in first out) |

## Namespace and imports

Namespaces are useful when using multiple schemas in order to avoid name collisions, also great for microservices to define their own schema.  
To use it simply surround your desired scopes with a namespace scope

`messages-schema.memorix`

```
Namespace messages {
  PubSub {
    addItem: {
      payload: int
      public: [publish subscribe]
    }
  }
}
```

then you can import it in your main schema

`schema.memorix`

```
Config {
  import: [
    "<path-to>/messages-schema.memorix"
    "<path-to>/another-schema.memorix"
  ]
  export: {
    files: [
      {
        language: typescript
        path: "memorix.generated.ts"
      }
    ]
  }
}

PubSub {
  addItem {
    payload: string
  }
}
```

Even though we defined `PubSub.addItem` twice, since one is in a namespace, they won't collide with each other.  
To use it in your project
{{< tabs >}}
{{% tab name="Javascript" %}}

```js
await memorix.pubsub.addItem.publish(12);
await memorix.messages.pubsub.addItem.publish("in 'messages' namespace");
```

{{% /tab %}}
{{% tab name="Python" %}}

```python
memorix.pubusb.addItem.publish(payload=12)
memorix.messages.pubusb.addItem.publish(payload="woin 'messages' namespacerld")
```

{{% /tab %}}
{{% tab name="Rust" %}}

```rust
memorix.pubusb.addItem.publish(&12).await?;
memorix.messages.pubusb.addItem.publish(&"woin 'messages' namespacerld").await?;
```

{{% /tab %}}
{{< /tabs >}}

You can also see we defined public in the imported `messages-schema.memorix`, by default, all imported API is private.
Here is a list of methods which we can define as public

- Cache methods (can be defined as private / public)
  | name | Description |
  | :----- | :------------------------ |
  | get | Getting the stored value |
  | set | Setting the stored value |
  | delete | Deleting the stored value |

- PubSub methods (can be defined as private / public)
  | name | Description |
  | :-------- | :---------------------------------- |
  | publish | Publishing a value to all listeners |
  | subscribe | Subscribing as a listener |

- Task methods (can be defined as private / public)
  | name | Description |
  | :------ | :------------------------------ |
  | enqueue | Adding a value to the queue |
  | dequeue | Getting a value from the queue |
  | empty | Clearing the queue |
  | get_len | Get current length of the queue |
