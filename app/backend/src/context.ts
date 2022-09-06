import { RedisPubSub } from "graphql-redis-subscriptions";
import { PrismaClient } from "@prisma/client";
import { MemorixReportApi } from "./report-api.generated";

const { REDIS_URL } = process.env;

type DB = PrismaClient;

const db = new PrismaClient({ log: ["query"] });
db.$on("query" as any, (e: any) => {
  console.log(`Duration: ${e.duration}ms`);
});

type KeyType = string | Buffer;
type ValueType = string | Buffer | number | any[];
type Ok = "OK";

type Redis = RedisPubSub & {
  get(key: KeyType): Promise<string | null>;
  set(
    key: KeyType,
    value: ValueType,
    expiryMode?: string | any[],
    time?: number | string,
    setMode?: number | string
  ): Promise<Ok | null>;
};

const redisPubSub = new RedisPubSub({
  connection: REDIS_URL,
});
const ioredis = redisPubSub.getPublisher();

const redis = Object.assign(redisPubSub, {
  get(...args: any[]) {
    return ioredis.get(...args);
  },
  set(...args: any[]) {
    return ioredis.set(...args);
  },
});

export interface Context {
  db: DB;
  redis: Redis;
  memorixReportApi: MemorixReportApi;
}

export const createContext: () => Context = () => {
  return {
    db,
    redis,
    memorixReportApi: new MemorixReportApi({
      redisUrl: process.env.REDIS_URL!,
    }),
  };
};
