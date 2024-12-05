// deno-fmt-ignore-file
// deno-lint-ignore-file
/* eslint-disable */
import { MemorixBase, getEnvVariable } from "./index.ts";

export enum Animal {
  dog = "dog",
  cat = "cat",
  person = "person",
}

export type User = {
  name: string;
  age: undefined | number;
};

export namespace spaceship {
  export namespace crew {
    export class Memorix extends MemorixBase {
      constructor(ref: MemorixBase) {
        super({
          namespaceNameTree: ["spaceship", "crew"],
        }, {
          ref,
        });
      }

      cache = {
        count: this.getCacheItemNoKey<number, true, true, true, true>("count", {
          ttl: "2",
        }),
      };
    }
  }
  export class Memorix extends MemorixBase {
    constructor(ref: MemorixBase) {
      super({
        namespaceNameTree: ["spaceship"],
      }, {
        ref,
      });
    }

    crew = new crew.Memorix(this);

    cache = {
      pilot: this.getCacheItemNoKey<{
        name: string;
      }, true, true, true, true>("pilot", {
        ttl: "2",
      }),
    };
  }
}
export class Memorix extends MemorixBase {
  constructor() {
    super({
      namespaceNameTree: [],
    }, {
      redisUrl: getEnvVariable("REDIS_URL"),
    });
  }

  spaceship = new spaceship.Memorix(this);

  cache = {
    favoriteAnimal: this.getCacheItem<string, Animal, true, true, true, true>("favoriteAnimal"),
    user: this.getCacheItem<string, User, true, true, true, true>("user"),
    userNoKey: this.getCacheItemNoKey<User, true, true, true, true>("userNoKey"),
    userExpire: this.getCacheItem<string, User, true, true, true, true>("userExpire", {
      ttl: "1",
    }),
    userExpire2: this.getCacheItem<string, User, true, true, true, true>("userExpire2", {
      ttl: "0",
    }),
    userExpire3: this.getCacheItem<string, User, true, true, true, true>("userExpire3", {
      ttl: "2",
      extendOnGet: "true",
    }),
  };
  pubsub = {
    message: this.getPubsubItemNoKey<string, true, true>("message"),
  };
  task = {
    runAlgo: this.getTaskItemNoKey<string, true, true, true, true>("runAlgo"),
    runAlgoNewest: this.getTaskItemNoKey<string, true, true, true, true>("runAlgoNewest", {
      queueType: "lifo",
    }),
  };
}