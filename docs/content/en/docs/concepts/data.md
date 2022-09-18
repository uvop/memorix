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

All the data transported through Memorix is parsed to and from JSON format, so to support that we introduced couple of ways to define your data (again, inspired by [GraphQL](https://graphql.org/graphql-js/basic-types/)).

## Primitive

Here are the basic primities you can use in your schema

| name    | Node.js type | Python  |
| :------ | :----------- | :------ |
| string  | `string`     | `str`   |
| int     | `number`     | `int`   |
| float   | `number`     | `float` |
| boolean | `boolean`    | `bool`  |

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

## Model

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
- Using `Model`

  ```
  Model Person {
    name: string
    height: int
    age: float
  }

  Cache {
      favoritePerson {
          payload: Person
      }
      secondFavoritePerson {
          payload: Person
      }
  }
  ```

## Nullable

All fields are required by default, to make them nullable, Simple add `?` after the type

```
Model Person {
  name: string
  height: int
  age: float
  hairColor: string?
}

Cache {
    favoritePerson {
        payload: Person
    }
    secondFavoritePerson {
        payload: Person? # Now can set a nullable value to "secondFavoritePerson"
    }
}
```

## Array

Simply add braces `[]` around your type

```
Cache {
    cultMembers {
        payload: [Person]
    }
}
```

## Enum

Can help make your schema much more readable!

```
Enum Animal {
  dog
  cat
  other
}

Cache {
    favoriteAnimal {
        payload: Animal
    }
}
```

## Union

Unions aren't supported, but you can use what we learned so far to define an object with different properties

```
Enum AnimalType {
  dog
  cat
  other
}

Model AnimalDogData {
  isAGoodBoy: boolean
}
Model AnimalCatData {
  likesCatnip: boolean
}
Model AnimalOtherData {
  tasty: boolean
}

Model Animal {
  type: AnimalType
  name: string
  dogData: AnimalDogData?
  catData: AnimalCatData?
  otherData: AnimalOtherData?
}

Cache {
    favoriteAnimal {
        payload: Animal
    }
}
```
