export interface Api {
  cache: {
    setUser1(key: string, user: User): Promise<void>;
    setUser2(key: { id: string }): Promise<void>;
    getUser1(key: string): Promise<User>;
    getUser2(key: { id: string }): Promise<User>;
  };

  pubsub: {
    addUser(key: string, user: User): Promise<User>;
  };

  queue: {
    handleUser(key: string, user: User): Promise<string>;
  };
}

export interface User {
  id: number;
  name: string;
  age?: number;
}
