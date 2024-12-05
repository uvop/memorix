export type CacheOptions = {
  ttl?: string;
  extendOnGet?: string;
};
export type TaskOptions = {
  queueType?: string;
};

export type CacheItem<
  Key,
  Payload,
  CanGet extends boolean,
  CanSet extends boolean,
  CanDelete extends boolean,
  CanExpire extends boolean,
> =
  & {
    key(key: Key): string;
    extend(key: Key): Promise<void>;
  }
  & (CanGet extends true ? {
      get(key: Key): Promise<Payload | null>;
    }
    : Record<string | number | symbol, never>)
  & (CanSet extends true ? {
      set(key: Key, payload: Payload): Promise<void>;
    }
    : Record<string | number | symbol, never>)
  & (CanDelete extends true ? {
      delete(key: Key): Promise<void>;
    }
    : Record<string | number | symbol, never>)
  & (CanExpire extends true ? {
      expire(key: Key, ttl: number): Promise<void>;
    }
    : Record<string | number | symbol, never>);

export type CacheItemNoKey<
  Payload,
  CanGet extends boolean,
  CanSet extends boolean,
  CanDelete extends boolean,
  CanExpire extends boolean,
> =
  & {
    extend(): Promise<void>;
  }
  & (CanGet extends true ? {
      get(): Promise<Payload | null>;
    }
    : Record<string | number | symbol, never>)
  & (CanSet extends true ? {
      set(payload: Payload): Promise<void>;
    }
    : Record<string | number | symbol, never>)
  & (CanDelete extends true ? {
      delete(): Promise<void>;
    }
    : Record<string | number | symbol, never>)
  & (CanExpire extends true ? {
      expire(ttl: number): Promise<void>;
    }
    : Record<string | number | symbol, never>);

export type PubsubCallback<Payload> = (payload: Payload) => void;

export type PubSubItem<
  Key,
  Payload,
  CanPublish extends boolean,
  CanSubscribe extends boolean,
> =
  & {
    key(key: Key): string;
  }
  & (CanPublish extends true ? {
      publish(key: Key, payload: Payload): Promise<{ subscribersSize: number }>;
    }
    : Record<string | number | symbol, never>)
  & (CanSubscribe extends true ? {
      subscribe(key: Key): Promise<{
        asyncIterator: AsyncIterableIterator<Payload>;
        unsubscribe: () => Promise<void>;
      }>;
      subscribe(
        key: Key,
        cb: (payload: Payload) => void,
      ): Promise<{
        unsubscribe: () => Promise<void>;
      }>;
    }
    : Record<string | number | symbol, never>);

export type PubSubItemNoKey<
  Payload,
  CanPublish extends boolean,
  CanSubscribe extends boolean,
> =
  & {
    key(): string;
  }
  & (CanPublish extends true ? {
      publish(payload: Payload): Promise<{ subscribersSize: number }>;
    }
    : Record<string | number | symbol, never>)
  & (CanSubscribe extends true ? {
      subscribe(): Promise<{
        asyncIterator: AsyncIterableIterator<Payload>;
        unsubscribe: () => Promise<void>;
      }>;
      subscribe(
        cb: (payload: Payload) => void,
      ): Promise<{
        unsubscribe: () => Promise<void>;
      }>;
    }
    : Record<string | number | symbol, never>);

export type TaskDequeueCallback<Payload> = (
  payload: Payload,
) => void;
type TaskDequeue = Promise<{ stop: () => Promise<void> }>;
type TaskDequeueAsyncIterator<Payload> = Promise<{
  stop: () => Promise<void>;
  asyncIterator: AsyncIterableIterator<Payload>;
}>;

export type TaskItem<
  Key,
  Payload,
  CanEnqueue extends boolean,
  CanDequeue extends boolean,
  CanEmpty extends boolean,
  CanGetLen extends boolean,
> =
  & {
    key(key: Key): string;
  }
  & (CanEnqueue extends true ? {
      enqueue(key: Key, payload: Payload): Promise<{ queueSize: number }>;
    }
    : Record<string | number | symbol, never>)
  & (CanDequeue extends true ? {
      dequeue(
        key: Key,
        callback: TaskDequeueCallback<Payload>,
      ): TaskDequeue;
      dequeue(
        key: Key,
      ): TaskDequeueAsyncIterator<Payload>;
    }
    : Record<string | number | symbol, never>)
  & (CanEmpty extends true ? {
      empty(key: Key): Promise<void>;
    }
    : Record<string | number | symbol, never>)
  & (CanGetLen extends true ? {
      getLen(key: Key): Promise<number>;
    }
    : Record<string | number | symbol, never>);

export type TaskItemNoKey<
  Payload,
  CanEnqueue extends boolean,
  CanDequeue extends boolean,
  CanEmpty extends boolean,
  CanGetLen extends boolean,
> =
  & {
    key(): string;
  }
  & (CanEnqueue extends true ? {
      enqueue(payload: Payload): Promise<{ queueSize: number }>;
    }
    : Record<string | number | symbol, never>)
  & (CanDequeue extends true ? {
      dequeue(
        callback: TaskDequeueCallback<Payload>,
      ): TaskDequeue;
      dequeue(): TaskDequeueAsyncIterator<Payload>;
    }
    : Record<string | number | symbol, never>)
  & (CanEmpty extends true ? {
      empty(): Promise<void>;
    }
    : Record<string | number | symbol, never>)
  & (CanGetLen extends true ? {
      getLen(): Promise<number>;
    }
    : Record<string | number | symbol, never>);
