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

const codegenRust: (schema: string, moreConfig?: string) => Promise<string> = (
  schema,
  moreConfig
) =>
  new Promise((res, rej) => {
    const schemaWithOutput = `
  Config {
    output: {
      language: "${Languages.rust}"
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

    codegen({ schemaFilePath: "schema.memorix" }).catch(rej);
  });

describe("python codegen", () => {
  describe("model", () => {
    it("can generate from model", async () => {
      expect(
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
    it("throws if model appears twice", (done) => {
      codegenRust(
        `
          Model User {
              id: int
          }
          Model User {
              id: int
          }
        `
      )
        .then(() => {
          done("Was supposed to throw");
        })
        .catch(() => {
          done();
        });
    });
  });
  describe("cache", () => {
    it("can generate with inline types", async () => {
      expect(
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
        await codegenRust(
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
                  payload: {
                    description: string
                  }
                }
              }
            }
            Namespace spaceship {
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
          `
        )
      ).toMatchSnapshot();
    });
  });
});
