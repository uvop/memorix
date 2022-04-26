import { BaseMemorixApi } from "@memorix/client-js";

export type User = {
  name: string;
  age?: number;
};

export class MemorixApi extends BaseMemorixApi {
  cache = {
    adminId: this.getCacheItem<never, string | undefined>("adminId"),
    user: this.getCacheItem<string, User>("user"),
  };
}
