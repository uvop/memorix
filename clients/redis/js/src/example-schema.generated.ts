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

export class MemorixApi extends MemorixClientApi.fromConfig({defaultOptions:{cache:{expire:{value:2}}}}) {
  cache = {
    favoriteAnimal: this.getCacheItem<string, Animal>("favoriteAnimal"),
    user: this.getCacheItem<string, User>("user"),
    userExpire: this.getCacheItem<string, User>("userExpire", {expire:{value:1000,isInMs:true}}),
  };

  pubsub = {
    message: this.getPubsubItemNoKey<string>("message"),
  };

  task = {
    runAlgo: this.getTaskItemNoKey<string, Animal>("runAlgo", true),
    runAlgoNewest: this.getTaskItemNoKey<string, Animal>("runAlgoNewest", true, {takeNewest:true}),
  };
}
