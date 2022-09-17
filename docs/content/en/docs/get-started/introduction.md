---
title: "Introduction"
description: ""
lead: ""
date: 2020-10-06T08:48:57+00:00
lastmod: 2020-10-06T08:48:57+00:00
draft: false
images: []
menu:
  docs:
    parent: "get-started"
weight: 100
toc: true
---

## What is memorix

Memorix is an open source next-generation in-memory ORM, it has the following parts:

- `Memorix CLI` - A command line interface tool to generate code from your schema, whatever your code is written in.
- `Memorix clients` - Runtime dependencies to the projects you use memorix in.

## Why memorix

Memorix was heavily inspired by [GraphQL](https://graphql.org/) and [Prisma](https://www.prisma.io/).
Both of them cover persistent memory layer and message layer, and they do it great.
Once your application needs in-memory service, such as Redis, Kafka, RabbitMQ and etc, we started to feel the pain of not having such great tools for the cache layer, and decides to make our own!
