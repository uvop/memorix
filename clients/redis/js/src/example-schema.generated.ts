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
    message: this.getPubsubItem<undefined, string>("message"),
  };

  task = {
    runAlgo: this.getTaskItem<undefined, string, Animal>("runAlgo"),
  };
}
