import { getNamespaces } from "src/core/block";
import { Languages, codegenByLanguage } from "src/languages";

const codegenTs = (schema: string) => {
  const ns = getNamespaces(schema);
  return codegenByLanguage(ns, Languages.typescript).trim();
};

describe("ts codegen", () => {
  describe("model", () => {
    it("can generate from model", () => {
      expect(
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
    it("can have options", () => {
      expect(
        codegenTs(
          `
            Cache {
              user {
                key: int
                payload: string
                options: {
                  expire: {
                    value: 5
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
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
        codegenTs(
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
        codegenTs(
          `
            Config {
              output: [
                  {
                      language: "typescript"
                      file: "example.generated.ts"
                  }
              ]
              extends: [
                "bla.memorix"
                "bla2.memorix"
              ]
            }
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
    it("can be null", () => {
      expect(
        codegenTs(
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
    it.only("can generate", () => {
      expect(
        codegenTs(
          `
            Namespace user {
              Cache {
                bio {
                  payload: string
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
