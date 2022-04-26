import { codegen } from "./codegen";
import { Languages } from "./languages";

const codegenTs = (schema: string) =>
  codegen({ schema, language: Languages.typescript });

describe("ts codegen", () => {
  describe.only("model", () => {
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
export interface User {
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
export interface User1 {
    id: number;
}

export interface User2 {
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
export interface User {
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
export interface User {
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
                payload: User
              }
            }
          `
        )
      ).toBe(
        `
import { BaseMemorixApi } from "@memorix/client-js";

export class MemorixApi extends BaseMemorixApi {
    cache = {
        getUser(key: number) {
            return this.cacheGet<string>("user", key, options);
        },
        setUser(key: number, payload: string) {
            return this.cacheSet("user", key, payload);
        },
    }
}
  `.trim()
      );
    });
  });
});
