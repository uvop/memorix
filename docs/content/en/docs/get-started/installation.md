---
title: "Installation"
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

## CLI installation

Follow the instructions below to install `memorix-cli` on your machine depends on the platform you use

### macOS, linux and WSL installation (recommanded)

#### Requirements

- [brew](https://brew.sh/) — Package manager for macOS and linux.
  - To install on Linux or WSL, [couple of commands are required after the install script](https://docs.brew.sh/Homebrew-on-Linux).

#### Steps

Run these in the terminal

```bash
brew tap uvop/memorix
brew install memorix
memorix --version
```

Done!  
if successful, you should see this in your terminal

```bash

@@@     @@@    @@@@@@&    @@     .@@      @@@@@     #@@@@@      @@    @&    &@
@@@@   @@@@    @@         @@@   @@@@    @@    %@    #@&   @@    @@     @@@@@@
@@ @@ @@ @@    @@^^^^^    @@ @@@@ @@    @@    @@    #@@@@@@     @@     @@@@@@
@@  @@@  @@    @@@@@@&    @@ .@@  @@      @@@@      #@&  @@@    @@    @&    &@

1.0.0
```

### Manual installation

This way also supports windows without WSL, but is a bit more tedious

- Go to [memorix releases on github](https://github.com/uvop/memorix/releases).
- Download the asset for your platform.
- Extract the executable somewhere in on your computer, like `~/.memorix/bin/*`.
- Add the folder extracted to to your `PATH` environment variable.
- Done!

## Client installation

To start using memorix, first head into your project/s and install the run-time dependency.  
The only support at the moment is for Redis.

### Redis client

{{< tabs >}}
{{% tab name="Node.js" %}}

```bash
npm install @memorix/client-redis
```

or

```bash
yarn add @memorix/client-redis
```

{{% /tab %}}
{{% tab name="Python" %}}

```bash
pip install memorix-client-redis
```

or

```bash
poetry add memorix-client-redis
```

{{% /tab %}}
{{< /tabs >}}

Now we're ready to start using memorix! Head on to [Quick start →]({{< relref "quick-start" >}})
