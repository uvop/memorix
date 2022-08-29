import { codegen } from "./codegen";
import { Languages } from "./languages";

const codegenPython = (schema: string) =>
  codegen({ schema, language: Languages.python }).trim();

describe("python codegen", () => {
  describe("model", () => {
    it.only("can generate from model", () => {
      expect(
        codegenPython(
          `
            Model User {
                id: int
                name: string
                age: float?
            }
          `
        )
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass

@dataclass
class User:
  id: int
  name: str
  age: typing.Optional[float]
  `.trim()
      );
    });
    it("can generate from 2 models", () => {
      expect(
        codegenPython(
          `
            Model User1 {
                id: number
            }
            Model User2 {
                name: string
                age: number?
            }
          `.trim()
        )
      ).toBe(
        `
export type User1 = {
  id: number;
};

export type User2 = {
  name: string;
  age?: number;
};
  `.trim()
      );
    });
    it("can generate from model within model", () => {
      expect(
        codegenPython(
          `
            Model User {
                id: number
                papa: {
                    name: string?
                }
            }
          `.trim()
        )
      ).toBe(
        `
export type User = {
  id: number;
  papa: {
    name?: string;
  };
};
  `.trim()
      );
    });
    it("can generate from model within model within a model", () => {
      expect(
        codegenPython(
          `
            Model User {
                id: number
                papa: {
                    name: string?
                    mama: {
                        sick: boolean
                    }?
                    age: number
                }
            }
          `.trim()
        )
      ).toBe(
        `
export type User = {
  id: number;
  papa: {
    name?: string;
    mama?: {
      sick: boolean;
    };
    age: number;
  };
};
  `.trim()
      );
    });
    it("can generate from model with array", () => {
      expect(
        codegenPython(
          `
            Model User {
                id: number
                names: [string]
                children: [{
                  id: number
                  name: string?
                }?]?
            }
          `
        )
      ).toBe(
        `
export type User = {
  id: number;
  names: Array<string>;
  children?: Array<{
    id: number;
    name?: string;
  } | undefined>;
};
  `.trim()
      );
    });
  });
  describe("cache", () => {
    it("can generate with inline types", () => {
      expect(
        codegenPython(
          `
            Cache {
              user {
                key: number
                payload: string
              }
            }
          `
        )
      ).toBe(
        `
import { MemorixClientApi } from "@memorix/client-redis";

export class MemorixApi extends MemorixClientApi {
  cache = {
    user: this.getCacheItem<number, string>("user"),
  };
}
  `.trim()
      );
    });
    it("can generate with inline object type", () => {
      expect(
        codegenPython(
          `
            Cache {
              user {
                key: number
                payload: {
                  name: string
                  age: number?
                }?
              }
            }
          `
        )
      ).toBe(
        `
import { MemorixClientApi } from "@memorix/client-redis";

export class MemorixApi extends MemorixClientApi {
  cache = {
    user: this.getCacheItem<number, {
      name: string;
      age?: number;
    } | undefined>("user"),
  };
}
  `.trim()
      );
    });
    it("can generate with no key", () => {
      expect(
        codegenPython(
          `
            Cache {
              user {
                payload: {
                  name: string
                  age: number?
                }?
              }
            }
          `
        )
      ).toBe(
        `
import { MemorixClientApi } from "@memorix/client-redis";

export class MemorixApi extends MemorixClientApi {
  cache = {
    user: this.getCacheItem<undefined, {
      name: string;
      age?: number;
    } | undefined>("user"),
  };
}
  `.trim()
      );
    });
    it("can generate also with model", () => {
      expect(
        codegenPython(
          `
          Cache {
            adminId {
                payload: string?
            }
            user {
                key: string
                payload: User
            }
          }
        
          Model User {
            name: string
            age: number?
          }
          `
        )
      ).toBe(
        `
import { MemorixClientApi } from "@memorix/client-redis";

export type User = {
  name: string;
  age?: number;
};

export class MemorixApi extends MemorixClientApi {
  cache = {
    adminId: this.getCacheItem<undefined, string | undefined>("adminId"),
    user: this.getCacheItem<string, User>("user"),
  };
}
  `.trim()
      );
    });
  });
  describe("pubsub", () => {
    it("can generate with inline types", () => {
      expect(
        codegenPython(
          `
            PubSub {
              message {
                key: number
                payload: string
              }
            }
          `
        )
      ).toBe(
        `
import { MemorixClientApi } from "@memorix/client-redis";

export class MemorixApi extends MemorixClientApi {
  pubsub = {
    message: this.getPubsubItem<number, string>("message"),
  };
}
  `.trim()
      );
    });
  });
  describe("task", () => {
    it("can generate with inline types", () => {
      expect(
        codegenPython(
          `
            Task {
              doIt {
                key: number
                payload: string
                returns: boolean
              }
            }
          `
        )
      ).toBe(
        `
import { MemorixClientApi } from "@memorix/client-redis";

export class MemorixApi extends MemorixClientApi {
  task = {
    doIt: this.getTaskItem<number, string, boolean>("doIt"),
  };
}
  `.trim()
      );
    });
  });
  describe("enum", () => {
    it("can generate", () => {
      expect(
        codegenPython(
          `
            Enum Animals {
              dog
              cat
              person
            }
          `
        )
      ).toBe(
        `
export enum Animals {
  dog = "dog",
  cat = "cat",
  person = "person",
}
  `.trim()
      );
    });
  });
});
