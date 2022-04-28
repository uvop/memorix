import { BaseMemorixApi } from "src";

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

export class MemorixApi extends BaseMemorixApi {
  cache = {
    adminId: this.getCacheItem<undefined, string>("adminId"),
    user: this.getCacheItem<string, User>("user"),
    adminId2: this.getCacheItem<undefined, string | undefined>("adminId2"),
    user2: this.getCacheItem<string, User2>("user2"),
  };

  task = {
    runAlgo: this.getTaskItem<never, string, Animals>("runAlgo"),
    runAlgo2: this.getTaskItem<never, string, string>("runAlgo2"),
  };
}
