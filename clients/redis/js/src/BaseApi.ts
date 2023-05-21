// eslint-disable-next-line max-classes-per-file
import Redis from "ioredis";
import { Namespace, DefaultOptions, Api as NamespaceApi } from "./Namespace";

export class BaseApi extends Namespace {
  public static withGlobal: (config: {
    defaultOptions?: DefaultOptions;
  }) => typeof BaseApi = (override) =>
    class ApiWith extends BaseApi {
      constructor(options: {
        redisUrl: string;
        defaultOptions?: DefaultOptions;
      }) {
        super({
          ...options,
          ...override,
        });
      }
    };

  private readonly namespaceApi: NamespaceApi;

  constructor({
    redisUrl,
    defaultOptions,
  }: {
    redisUrl: string;
    defaultOptions?: DefaultOptions;
  }) {
    const redis = new Redis(redisUrl, { lazyConnect: true });
    const namespaceApi: NamespaceApi = {
      redis,
      redisSub: redis.duplicate(),
      redisTasks: [],
    };
    super({
      api: namespaceApi,
      defaultOptions,
    });
    this.namespaceApi = namespaceApi;
  }

  async connect(): Promise<void> {
    await this.namespaceApi.redis.connect();
    await this.namespaceApi.redisSub.connect();
  }

  disconnect(): void {
    this.namespaceApi.redis.disconnect();
    this.namespaceApi.redisSub.disconnect();
    this.namespaceApi.redisTasks.forEach((x) => {
      x.disconnect();
    });
  }
}
