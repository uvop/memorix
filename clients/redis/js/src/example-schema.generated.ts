import { MemorixClientApi } from "./MemorixClientApi";

export enum Animals {
  dog = "dog",
  cat = "cat",
  person = "person",
}

export type User = {
  name: string;
  age?: number;
};

export type User2 = {
  name: string;
  age?: number;
};

export class MemorixApi extends MemorixClientApi {
  cache = {
    adminId: this.getCacheItem<undefined, string | undefined>("adminId"),
    user: this.getCacheItem<string, User>("user"),
    adminId2: this.getCacheItem<undefined, string | undefined>("adminId2"),
    user2: this.getCacheItem<string, User2>("user2"),
  };

  task = {
    runAlgo: this.getTaskItem<undefined, string, Animals>("runAlgo"),
    runAlgo2: this.getTaskItem<undefined, string, string>("runAlgo2"),
  };
}
