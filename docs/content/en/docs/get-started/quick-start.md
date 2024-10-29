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

- Create a file with name `schema.memorix` in the root of your project (remove unwanted output languages)

  ```
  Config {
    engine: Redis("redis://localhost:6379/0")
    export: {
        files: [
            {
                language: typescript
                path: "memorix.generated.ts"
            }
            {
                language: python
                path: "memorix_generated.py"
            }
            {
                language: rust
                path: "memorix_generated.rs"
            }
        ]
    }
  }

  Cache {
      hello: {
          payload: string
      }
      rating: {
          payload: u32
      }
  }

  PubSub {
      message: {
          payload: string
      }
  }
  ```

- Now we can generate code for the schema we created using the `Memorix CLI` (and on future schema changes), simply un this in your terminal

  ```bash
  memorix codegen ./schema.memorix
  ```

  - Now API files have been generated in your source code folder, you can start using the API.

    - To format the schema file and validate it, run

    ```bash
    memorix format ./schema.memorix
    ```

## Using the schema API (redis)

Here is a code example of how to use the schema we created

- Note: you need a redis service running, this code example assumes you do

{{< tabs >}}
{{% tab name="Javascript" %}}

```js
import { Memorix } from "src/memorix.generated";

const start = async () => {
  const memorix = new Memorix();

  await memorix.cache.hello.set("world");
  await memorix.cache.rating.set(10);
  const helloValue = await memorix.cache.hello.get();

  console.log(helloValue); // Should print "world"
};

start();
```

{{% /tab %}}
{{% tab name="Python" %}}

```python
from src.memorix_generated import Memorix

memorix = Memorix()

memorix.cache.hello.set("world")
memorix.cache.rating.set(10)
hello_value = memorix.cache.hello.get()

print(hello_value) # Should print "world"
```

{{% /tab %}}
{{% tab name="Rust" %}}

```rust
mod memorix_generated;

use memorix_generated as mx;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
    let memorix = mx::Memorix::new().await?;

    memorix.cache.hello.set(&"world".to_string()).await?;
    memorix.cache.rating.set(&10).await?;
    let hello_value = memorix.cache.hello.get().await?;

    println!("{:?}", hello_value); // Should print "world"

    Ok(())
}
```

{{% /tab %}}
{{< /tabs >}}

You can explore the API we created using your IDE since it's fully typed.
To learn which other features Memorix has to offer, start by checking [defining your data →]({{< relref "data" >}})
