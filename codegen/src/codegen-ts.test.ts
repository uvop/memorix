import "jest";
import { codegen } from "./codegen";

describe("ts codegen", () => {
  describe("model", () => {
    it("can generate from model", () => {
      expect(
        codegen({
          schema: `
            Model User {
                id: number
                name: string
                age: number?
            }
          `,
        })
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
        codegen({
          schema: `
            Model User1 {
                id: number
            }
            Model User2 {
                name: string
                age: number?
            }
          `.trim(),
        })
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
        codegen({
          schema: `
            Model User {
                id: number
                papa: {
                  name: string?
                }
            }
          `.trim(),
        })
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
        codegen({
          schema: `
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
          `.trim(),
        })
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
        codegen({
          schema: `
            Cache {
              user: {
                key: number
                payload: string
              }
            }
          `,
        })
      ).toBe(
        `
import { cacheGet, cacheSet } from "@memorix/client-js";

export const api = {
    cache: {
        getUser(key: number) {
            return cacheGet("user", key) as string;
        },
        setUser(key: number, payload: string) {
            return cacheSet("user", key, payload);
        },
    },
}
  `.trim()
      );
    });
  });
});
