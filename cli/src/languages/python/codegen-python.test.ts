import { codegenByLanguage, Languages } from "src/languages";

const codegenPython = (schema: string) =>
  codegenByLanguage(schema, Languages.python).trim();

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
                id: int
            }
            Model User2 {
                name: string
                age: int?
            }
          `.trim()
        )
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass

@dataclass
class User1:
  id: int

@dataclass
class User2:
  name: str
  age: typing.Optional[int]
  `.trim()
      );
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
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass

@dataclass
class UserPapa:
  name: typing.Optional[str]

@dataclass
class User:
  id: int
  papa: UserPapa
  `.trim()
      );
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
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass

@dataclass
class UserPapaMama:
  sick: bool

@dataclass
class UserPapa:
  name: typing.Optional[str]
  mama: typing.Optional[UserPapaMama]
  age: int

@dataclass
class User:
  id: int
  papa: UserPapa
  `.trim()
      );
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
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass

@dataclass
class UserChildren:
  id: int
  name: typing.Optional[str]

@dataclass
class User:
  id: int
  names: typing.List[str]
  children: typing.Optional[typing.List[typing.Optional[UserChildren]]]
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
                key: int
                payload: string
              }
            }
          `
        )
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass, MemorixClientApi, MemorixClientCacheApi, MemorixClientCacheApiItem

class MemorixCacheApi(MemorixClientCacheApi):
  def __init__(self, *args, **kwargs):
    super(MemorixCacheApi, self).__init__(*args, **kwargs)

    user = MemorixClientCacheApiItem(int, str, *args, **kwargs)

class MemorixApi(MemorixClientApi):
  def __init__(self, *args, **kwargs):
    super(MemorixApi, self).__init__(*args, **kwargs)

    cache = MemorixCacheApi(*args, **kwargs)
  `.trim()
      );
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
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass, MemorixClientApi, MemorixClientCacheApi, MemorixClientCacheApiItem

@dataclass
class CacheUserPayload:
  name: str
  age: typing.Optional[int]

class MemorixCacheApi(MemorixClientCacheApi):
  def __init__(self, *args, **kwargs):
    super(MemorixCacheApi, self).__init__(*args, **kwargs)

    user = MemorixClientCacheApiItem(int, typing.Optional[CacheUserPayload], *args, **kwargs)

class MemorixApi(MemorixClientApi):
  def __init__(self, *args, **kwargs):
    super(MemorixApi, self).__init__(*args, **kwargs)

    cache = MemorixCacheApi(*args, **kwargs)
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
                  age: int?
                }?
              }
            }
          `
        )
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass, MemorixClientApi, MemorixClientCacheApi, MemorixClientCacheApiItem

@dataclass
class CacheUserPayload:
  name: str
  age: typing.Optional[int]

class MemorixCacheApi(MemorixClientCacheApi):
  def __init__(self, *args, **kwargs):
    super(MemorixCacheApi, self).__init__(*args, **kwargs)

    user = MemorixClientCacheApiItem(None, typing.Optional[CacheUserPayload], *args, **kwargs)

class MemorixApi(MemorixClientApi):
  def __init__(self, *args, **kwargs):
    super(MemorixApi, self).__init__(*args, **kwargs)

    cache = MemorixCacheApi(*args, **kwargs)
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
            age: int?
          }
          `
        )
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass, MemorixClientApi, MemorixClientCacheApi, MemorixClientCacheApiItem

@dataclass
class User:
  name: str
  age: typing.Optional[int]

class MemorixCacheApi(MemorixClientCacheApi):
  def __init__(self, *args, **kwargs):
    super(MemorixCacheApi, self).__init__(*args, **kwargs)

    adminId = MemorixClientCacheApiItem(None, typing.Optional[str], *args, **kwargs)
    user = MemorixClientCacheApiItem(str, User, *args, **kwargs)

class MemorixApi(MemorixClientApi):
  def __init__(self, *args, **kwargs):
    super(MemorixApi, self).__init__(*args, **kwargs)

    cache = MemorixCacheApi(*args, **kwargs)
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
                key: int
                payload: string
              }
            }
          `
        )
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass, MemorixClientApi, MemorixClientPubsubApi, MemorixClientPubsubApiItem

class MemorixPubsubApi(MemorixClientPubsubApi):
  def __init__(self, *args, **kwargs):
    super(MemorixPubsubApi, self).__init__(*args, **kwargs)

    message = MemorixClientPubsubApiItem(int, str, *args, **kwargs)

class MemorixApi(MemorixClientApi):
  def __init__(self, *args, **kwargs):
    super(MemorixApi, self).__init__(*args, **kwargs)

    pubsub = MemorixPubsubApi(*args, **kwargs)
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
                key: int
                payload: string
                returns: boolean
              }
            }
          `
        )
      ).toBe(
        `
import typing
from memorix_client_redis import dataclass, MemorixClientApi, MemorixClientTaskApi, MemorixClientTaskApiItem

class MemorixTaskApi(MemorixClientTaskApi):
  def __init__(self, *args, **kwargs):
    super(MemorixTaskApi, self).__init__(*args, **kwargs)

    doIt = MemorixClientTaskApiItem(int, str, bool, *args, **kwargs)

class MemorixApi(MemorixClientApi):
  def __init__(self, *args, **kwargs):
    super(MemorixApi, self).__init__(*args, **kwargs)

    task = MemorixTaskApi(*args, **kwargs)
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
import typing
from enum import Enum
from memorix_client_redis import dataclass

class Animals(Enum):
  dog = "dog"
  cat = "cat"
  person = "person"
  `.trim()
      );
    });
  });
});
