import "jest";
import { codegen } from "./codegen";

describe("ts codegen", () => {
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
                }
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
        mama: {
            sick: boolean;
        };
        age: number;
    };
}
`.trim()
    );
  });
});
