import { MemorixClientApi } from "./index";

export enum Animal {
  dog = "dog",
  cat = "cat",
  person = "person",
}

export type User = {
  name: string;
  age?: number;
};

export class MemorixApi extends MemorixClientApi {
  cache = {
    favoriteAnimal: this.getCacheItem<string, Animal>("favoriteAnimal"),
    user: this.getCacheItem<string, User>("user"),
  };

  pubsub = {
    message: this.getPubsubItemNoKey<string>("message"),
  };

  task = {
    runAlgo: this.getTaskItemNoKey<string, Animal>("runAlgo", true),
  };
}
