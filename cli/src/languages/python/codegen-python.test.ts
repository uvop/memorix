import { Languages } from "src/languages";
import { codegen } from "src/codgen";
import fs from "fs";

jest.mock("fs", () => {
  return {
    promises: {
      writeFile: jest.fn(),
      readFile: jest.fn(),
    },
  };
});

const codegenPython: (
  schema: string,
  moreConfig?: string
) => Promise<string> = (schema, moreConfig) =>
  new Promise((res) => {
    const schemaWithOutput = `
  Config {
    output: {
      language: "${Languages.python}"
      file: "generated.ts"
    }
    ${moreConfig}
  }

  ${schema}
  `;

    (fs.promises.readFile as jest.Mock).mockImplementation(async () => ({
      async toString() {
        return schemaWithOutput;
      },
    }));
    (fs.promises.writeFile as jest.Mock).mockImplementation(
      async (path, content) => {
        res(content);
      }
    );

    codegen({ schemaFilePath: "schema.memorix" });
  });

describe("python codegen", () => {
  describe("model", () => {
    it("can generate from model", async () => {
      expect(
        await codegenPython(
          `
            Model User {
                id: int
                name: string
                age: float?
            }
          `
        )
      ).toMatchSnapshot();
    });
    it("can generate from 2 models", async () => {
      expect(
        await codegenPython(
          `
            Model User1 {
                id: int
            }
            Model User2 {
                name: string
                age: int?
            }
          `.trim()
        )
      ).toMatchSnapshot();
    });
    it("can generate from model within model", async () => {
      expect(
        await codegenPython(
          `
            Model User {
                id: int
                papa: {
                    name: string?
                }
            }
          `.trim()
        )
      ).toMatchSnapshot();
    });
    it("can generate from model within model within a model", async () => {
      expect(
        await codegenPython(
          `
            Model User {
                id: int
                papa: {
                    name: string?
                    mama: {
                        sick: boolean
                    }?
                    age: int
                }
            }
          `.trim()
        )
      ).toMatchSnapshot();
    });
    it("can generate from model with array", async () => {
      expect(
        await codegenPython(
          `
            Model User {
                id: int
                names: [string]
                children: [{
                  id: int
                  name: string?
                }?]?
            }
          `
        )
      ).toMatchSnapshot();
    });
    it("throws if model appears twice", async () => {
      expect(
        await codegenPython(
          `
            Model User {
                id: int
            }
            Model User {
                id: int
            }
          `
        )
      ).toThrowError();
    });
  });
  describe("cache", () => {
    it("can generate with inline types", async () => {
      expect(
        await codegenPython(
          `
            Cache {
              user {
                key: int
                payload: string
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
    it("can generate with inline types and convert to CamelCase", async () => {
      expect(
        await codegenPython(
          `
            Cache {
              user_by_number {
                key: int
                payload: {
                  name: string
                  age: int
                }
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
    it("can have options", async () => {
      expect(
        await codegenPython(
          `
            Cache {
              user {
                key: int
                payload: string
                options: {
                  expire: {
                    value: 5
                    extendOnGet: true
                  }
                }
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
    it("can generate with inline object type", async () => {
      expect(
        await codegenPython(
          `
            Cache {
              user {
                key: int
                payload: {
                  name: string
                  age: int?
                }?
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
    it("can generate with no key", async () => {
      expect(
        await codegenPython(
          `
            Cache {
              user {
                payload: {
                  name: string
                  age: int?
                }?
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
    it("can generate also with model", async () => {
      expect(
        await codegenPython(
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
            age: int?
          }
          `
        )
      ).toMatchSnapshot();
    });
  });
  describe("pubsub", () => {
    it("can generate with inline types", async () => {
      expect(
        await codegenPython(
          `
            PubSub {
              message {
                key: int
                payload: string
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
  });
  describe("task", () => {
    it("can generate with inline types", async () => {
      expect(
        await codegenPython(
          `
            Task {
              doIt {
                key: int
                payload: string
                returns: boolean
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
    it("can have options", async () => {
      expect(
        await codegenPython(
          `
            Task {
              doIt {
                key: int
                payload: string
                returns: boolean
                options: {
                  takeNewest: true
                }
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
  });
  describe("enum", () => {
    it("can generate", async () => {
      expect(
        await codegenPython(
          `
            Enum Animals {
              dog
              cat
              person
            }
          `
        )
      ).toMatchSnapshot();
    });
  });
  describe("config", () => {
    it("can generate", async () => {
      expect(
        await codegenPython(
          `
            DefaultOptions {
              cache: {
                expire: {
                  value: 5
                  extendOnGet: true
                }
              }
              task: {
                takeNewest: true
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
    it("can be null", async () => {
      expect(
        await codegenPython(
          `
            DefaultOptions {
              cache: {
                expire: null
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
  });
  describe("namespace", () => {
    it("can generate", async () => {
      expect(
        await codegenPython(
          `
            Namespace user {
              DefaultOptions {
                cache: {
                  expire: {
                    value: 5
                  }
                }
              }
              Cache {
                bio {
                  payload: string
                }
              }
            }
            DefaultOptions {
              cache: {
                expire: {
                  value: 6
                }
              }
            }
            Cache {
              favoriteUser {
                payload: string
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
  });
});
