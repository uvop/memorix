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

Follow the instructions below to install `memorix-cli` on your machine depending on the platform you use

### macOS, linux and WSL installation

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
if successful, you should see the version installed in your terminal

### Windows

#### Requirements

- [choco](https://chocolatey.org/) — Package manager for Windows.

#### Steps

Run these in the cmd

```bash
choco install memorix
memorix --version
```

Done!  
if successful, you should see the version installed in your terminal

### Manual installation

- Go to [memorix releases on github](https://github.com/uvop/memorix/releases).
- Download the executable for your platform and place somewhere in your system (for instance, `~/.memorix`)
- Add the folder where the executable is to your `PATH` environment variable.
- Done!

## Client installation

To start using Memorix, first head into your project(s) and install the run-time dependency.  
At the moment, only Redis is supported

### Redis client

{{< tabs >}}
{{% tab name="Javascript" %}}

Deno

```bash
deno add jsr:@memorix/client-redis
```

Bun

```bash
bunx jsr add @memorix/client-redis
```

npm

```bash
npx jsr add @memorix/client-redis
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
{{% tab name="Rust" %}}

```bash
cargo add memorix-client-redis
```

{{% /tab %}}
{{< /tabs >}}

Now we're ready to start using Memorix! Head on to [Quick start →]({{< relref "quick-start" >}})
