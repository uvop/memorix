/* eslint-disable */
import { BaseMemorixApi, MemorixNamespace } from "./index";

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
class NamespaceSpaceship extends MemorixNamespace.with({name:"spaceship"}) {
  cache = {
    pilot: this.getCacheItemNoKey<{
      name: string;
    }>("pilot"),
  };
}

// prettier-ignore
export class MemorixApi extends BaseMemorixApi.withGlobal({defaultOptions:{cache:{expire:{value:2}}}}) {
  spaceship = this.getNamespaceItem(NamespaceSpaceship);

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
