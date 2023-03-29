/* eslint-disable */
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

// prettier-ignore
export class MemorixApi extends MemorixClientApi.fromConfig({defaultOptions:{cache:{expire:{value:2}}}}) {
  cache = {
    favoriteAnimal: this.getCacheItem<string, Animal>("favoriteAnimal"),
    user: this.getCacheItem<string, User>("user"),
    // prettier-ignore
    userExpire: this.getCacheItem<string, User>("userExpire", {expire:{value:1000,isInMs:true}}),
    // prettier-ignore
    userExpire2: this.getCacheItem<string, User>("userExpire2", {expire:undefined}),
    // prettier-ignore
    userExpire3: this.getCacheItem<string, User>("userExpire3", {expire:{value:2,extendOnGet:true}}),
  };

  pubsub = {
    message: this.getPubsubItemNoKey<string>("message"),
  };

  task = {
    runAlgo: this.getTaskItemNoKey<string, Animal>("runAlgo", true),
    // prettier-ignore
    runAlgoNewest: this.getTaskItemNoKey<string, Animal>("runAlgoNewest", true, {takeNewest:true}),
  };
}
