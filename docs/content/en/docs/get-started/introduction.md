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

## What is Memorix

Memorix is an open source next-generation in-memory ORM.  
It has the following parts:

- `Memorix CLI` - A command line interface tool to generate code from your schema, regardless of language your code is written in.
- `Memorix clients` - Runtime dependencies to the projects you use Memorix in.

## Why Memorix

Memorix was heavily inspired by [GraphQL](https://graphql.org/) and [Prisma](https://www.prisma.io/).  
Both of them cover the persistent memory and messaging layers, and they do it great.

Though, once your application needs in-memory service, such as Redis, Kafka, RabbitMQ and etc, we felt these pains of not having a good enough tool for the cache layer, so we decided to write/make our own!
