/* eslint-disable */
import { MemorixBase } from "./index";

class MemorixSpaceshipCrew extends MemorixBase {
  protected namespaceNameTree = ["spaceship", "crew"];

  cache = {
    count: this.getCacheItemNoKey<number>("count"),
  };
}

class MemorixSpaceship extends MemorixBase {
  protected namespaceNameTree = ["spaceship"];

  crew = this.getNamespaceItem(MemorixSpaceshipCrew);

  cache = {
    pilot: this.getCacheItemNoKey<{
      name: string;
    }>("pilot"),
  };
}

export enum Animal {
  dog = "dog",
  cat = "cat",
  person = "person",
}

export type User = {
  name: string;
  age?: number;
};

export class Memorix extends MemorixBase {
  protected namespaceNameTree = [];

  // prettier-ignore
  protected defaultOptions = {cache:{expire:{value:2}}};

  spaceship = this.getNamespaceItem(MemorixSpaceship);

  cache = {
    favoriteAnimal: this.getCacheItem<string, Animal>("favoriteAnimal"),
    user: this.getCacheItem<string, User>("user"),
    userNoKey: this.getCacheItemNoKey<User>("userNoKey"),
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
