import { getBlocks } from "src/core/block";
import { codegenByLanguage, Languages } from "src/languages";

const codegenPython = (schema: string) => {
  const blocks = getBlocks(schema);
  return codegenByLanguage(blocks, Languages.python).trim();
};

describe("python codegen", () => {
  describe("model", () => {
    it("can generate from model", () => {
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
      ).toMatchSnapshot();
    });
    it("can generate from 2 models", () => {
      expect(
        codegenPython(
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
    it("can generate from model within model", () => {
      expect(
        codegenPython(
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
    it("can generate from model within model within a model", () => {
      expect(
        codegenPython(
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
    it("can generate from model with array", () => {
      expect(
        codegenPython(
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
  });
  describe("cache", () => {
    it("can generate with inline types", () => {
      expect(
        codegenPython(
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
    it("can generate with inline types and convert to CamelCase", () => {
      expect(
        codegenPython(
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
    it("can have options", () => {
      expect(
        codegenPython(
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
    it("can generate with inline object type", () => {
      expect(
        codegenPython(
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
    it("can generate with no key", () => {
      expect(
        codegenPython(
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
            age: int?
          }
          `
        )
      ).toMatchSnapshot();
    });
  });
  describe("pubsub", () => {
    it("can generate with inline types", () => {
      expect(
        codegenPython(
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
    it("can generate with inline types", () => {
      expect(
        codegenPython(
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
    it("can have options", () => {
      expect(
        codegenPython(
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
      ).toMatchSnapshot();
    });
  });
  describe("config", () => {
    it("can generate", () => {
      expect(
        codegenPython(
          `
            Config {
              extends: [
                "bla.memorix"
              ]
              defaultOptions: {
                cache: {
                  expire: {
                    value: 5
                  }
                }
                task: {
                  takeNewest: true
                }
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
    it("can be null", () => {
      expect(
        codegenPython(
          `
            Config {
              defaultOptions: {
                cache: {
                  expire: null
                }
              }
            }
          `
        )
      ).toMatchSnapshot();
    });
  });
});
