export interface Api {
  cache: {
    setUser1(key: string, user: User): Promise<void>;
    setUser2(key: { id: string }): Promise<void>;
    getUser1(key: string): Promise<User>;
    getUser2(key: { id: string }): Promise<User>;
  };
}

export interface User {
  id: number;
  name: string;
  age?: number;
}
