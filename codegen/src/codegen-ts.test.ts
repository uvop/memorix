import { codegen } from "./codegen";
import { Languages } from "./languages";

const codegenTs = (schema: string) =>
  codegen({ schema, language: Languages.typescript });

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
}
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
}

export type User2 = {
    name: string;
    age?: number;
}
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
}
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
}
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
import { BaseMemorixApi } from "@memorix/client-js";

export class MemorixApi extends BaseMemorixApi {
    cache = {
        user: this.getCacheItem<number, string>("user"),
    }
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
import { BaseMemorixApi } from "@memorix/client-js";

export class MemorixApi extends BaseMemorixApi {
    cache = {
        user: this.getCacheItem<number, {
            name: string;
            age?: number;
        } | undefined>("user"),
    }
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
import { BaseMemorixApi } from "@memorix/client-js";

export class MemorixApi extends BaseMemorixApi {
    cache = {
        user: this.getCacheItem<never, {
            name: string;
            age?: number;
        } | undefined>("user"),
    }
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
import { BaseMemorixApi } from "@memorix/client-js";

export type User = {
    name: string;
    age?: number;
}

export class MemorixApi extends BaseMemorixApi {
    cache = {
        adminId: this.getCacheItem<never, string | undefined>("adminId"),
        user: this.getCacheItem<string, User>("user"),
    }
}
  `.trim()
      );
    });
  });
});
