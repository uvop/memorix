import { codegen } from "./codegen";
import { Languages } from "./languages";

const codegenTs = (schema: string) =>
  codegen({ schema, language: Languages.typescript }).trim();

describe("ts codegen", () => {
  describe("model", () => {
    it("can generate from model", () => {
      expect(
        codegenTs(
          `
            Model User {
                id: number
                name: string
                age: number?
            }
          `
        )
      ).toBe(
        `
export type User = {
  id: number;
  name: string;
  age?: number;
};
  `.trim()
      );
    });
    it("can generate from 2 models", () => {
      expect(
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
import { MemorixClientApi } from "@memorix/client-js";

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
        codegenTs(
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
import { MemorixClientApi } from "@memorix/client-js";

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
        codegenTs(
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
import { MemorixClientApi } from "@memorix/client-js";

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
        codegenTs(
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
import { MemorixClientApi } from "@memorix/client-js";

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
        codegenTs(
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
import { MemorixClientApi } from "@memorix/client-js";

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
        codegenTs(
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
import { MemorixClientApi } from "@memorix/client-js";

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
        codegenTs(
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
