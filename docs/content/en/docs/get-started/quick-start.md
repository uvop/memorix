---
title: "Quick start"
date: 2020-11-16T13:59:39+01:00
lastmod: 2020-11-16T13:59:39+01:00
draft: false
images: []
menu:
  docs:
    parent: "get-started"
weight: 110
toc: true
---

Now we have all the tools needed to create our schema and start using it!

## Creating schema

First, lets create a basic schema.

- Create a file with name `schema.memorix` in the root of your project
  ```
  Cache {
      hello {
          payload: string
      }
      rating {
          payload: int
      }
  }
  PubSub {
      message {
          payload: string
      }
  }
  ```
- Now we can generate code for the schema we created using the `Memorix CLI` (and on future schema changes)
  {{< tabs >}}
  {{% tab name="Node.js" %}}
  Add this to your `package.json`

  ```json
  "scripts": {
    ...
    "memorix": "memorix codegen ./schema.memorix typescript src/memorix-api.ts"
  }
  ```

  Now run this in your terminal

  ```bash
  npm run memorix
  ```

  or

  ```bash
  yarn memorix
  ```

  {{% /tab %}}
  {{% tab name="Python" %}}
  Run this in your terminal

  ```bash
  memorix codegen ./schema.memorix python <projects_name>/memorix_api.py
  ```

  {{% /tab %}}
  {{< /tabs >}}

  - Now API files have been generated in your source code folder, you can start using the API.

## Using the schema API (redis)

Here is a code example of how to use the schema we created

- Note: you need a redis service running, this code example assumes you do

{{< tabs >}}
{{% tab name="Node.js" %}}

```js
import MemorixApi from "src/generated-schema";

const start = async () => {
  const memorixApi = new MemorixApi({ redisUrl: "redis://localhost:6379/0" });

  await memorixApi.cache.hello.set("world");
  await memorixApi.cache.rating.set(10);
  const helloValue = await memorixApi.cache.hello.get();

  console.log(helloValue); // Should print "world"
};

start();
```

{{% /tab %}}
{{% tab name="Python" %}}

```python
from src.generated_schema import MemorixApi

memorix_api = MemorixApi(redis_url="redis://localhost:6379/0")

memorix_api.cache.hello.set("world")
memorix_api.cache.rating.set(10)
hello_value = memorix_api.cache.hello.get()

print(hello_value) # Should print "world"
```

{{% /tab %}}
{{< /tabs >}}

You can explore the API we created using your IDE since it's fully typed.
To learn which other features Memorix has to offer, start by checking [defining your data →]({{< relref "data" >}})
