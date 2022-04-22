export interface Api {
  cache: {
    setUser1(key: string, payload: User): Promise<void>;
    setUser2(key: { id: string }): Promise<void>;
    getUser1(key: string): Promise<User>;
    getUser2(key: { id: string }): Promise<User>;
  };

  pubsub: {
    publishUserAdded(key: string, payload: User): Promise<void>;
    subscribeUserAdded(
      key: string,
      handler: (payload: User) => Promise<void> | void
    ): Promise<Unsubscribe>;
  };

  queue: {
    queueAddUser(key: string, payload: User): Promise<string>;
    dequeueAddUser(
      key: string,
      handler: (payload: User) => Promise<string> | string
    ): Promise<Unsubscribe>;
  };
}

export interface User {
  id: number;
  name: string;
  age?: number;
}

type Unsubscribe = () => void;
