---
title: "Defining your data"
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

In the [Quick start]({{< relref "quick-start" >}}) guide we got to put a simple string value in and out of the in-memory cache, here we'll learn how to define more complicated data structures.

All the data transported through Memorix is parsed to and from JSON format, so to support that we introduced several of ways to define your data (again, inspired by [GraphQL](https://graphql.org/graphql-js/basic-types/)).

## Primitive

Here are the basic primities you can use in your schema

| name    | Javascript type | Python  | Rust      |
| :------ | :-------------- | :------ | :-------- |
| string  | `string`        | `str`   | `String`  |
| u32     | `number`        | `int`   | `u32`     |
| i32     | `number`        | `int`   | `i32`     |
| f32     | `number`        | `float` | `f32`     |
| u64     | `number`        | `int`   | `u64`     |
| i64     | `number`        | `int`   | `i64`     |
| f64     | `number`        | `float` | `f64`     |
| boolean | `boolean`       | `bool`  | `boolean` |

Example

```
Cache {
    hello {
        payload: string
    }
    myAge {
      payload: float
    }
}
```

## Type

You can either define your objects inline or outside of your usage, for example

- Inline
  ```
  Cache {
      favoritePerson {
          payload: {
            name: string
            height: int
            age: float
          }
      }
  }
  ```
- Using `Type`

  ```
  Type {
    Person: {
      name: string
      height: int
      age: float
    }
  }

  Cache {
      favoritePerson: {
          payload: Person
      }
      secondFavoritePerson: {
          payload: Person
      }
  }
  ```

## Nullable

All fields are required by default, to make them nullable, Simply add `?` after the type

```
Type {
  Person: {
    name: string
    height: int
    age: float
    hairColor: string?
  }
}

Cache {
    favoritePerson: {
        payload: Person
    }
    secondFavoritePerson: {
        payload: Person?
    }
}
```

## Array

Simply add braces `[]` around your type

```
Cache {
    cultMembers: {
        payload: [Person]
    }
}
```

## Enum

Can help make your schema much more readable!

```
Enum {
  Animal {
    dog
    cat
    other
  }
}

Cache {
    favoriteAnimal: {
        payload: Animal
    }
}
```

## Union

Unions aren't supported, but you can use what we learned so far to define an object with different properties

```
Enum {
  AnimalType {
    dog
    cat
    other
  }
}

Type {
  Animal: {
    type: AnimalType
    name: string
    dogData: AnimalDogData?
    catData: AnimalCatData?
    otherData: AnimalOtherData?
  }
  AnimalDogData: {
    isAGoodBoy: boolean
  }
  AnimalCatData: {
    likesCatnip: boolean
  }
  AnimalOtherData: {
    tasty: boolean
  }
}

Cache {
    favoriteAnimal: {
        payload: Animal
    }
}
```
