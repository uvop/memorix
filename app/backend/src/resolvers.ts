import { Language, Resolvers } from "./schema-resolvers-generated";

export const resolvers: Resolvers = {
  PropertyValue: {
    // eslint-disable-next-line no-underscore-dangle
    __resolveType(res) {
      if ("properties" in res) {
        return "SchemaObject";
      }

      return "SchemaValue";
    },
  },
  Query: {
    test() {
      return true;
    },
    schema() {
      return {
        models: [
          {
            id: "1",
            name: "User",
            object: {
              properties: [
                {
                  name: "name",
                  isOptional: true,
                  value: {
                    typeName: "string",
                  },
                },
              ],
            },
          },
        ],
        cache: [
          {
            id: "2",
            name: "admin",
            payload: {
              typeName: "User",
            },
          },
        ],
      };
    },
  },
  Mutation: {
    async echo(info, args, ctx) {
      const message = await ctx.db.message.create({
        select: {
          id: true,
        },
        data: {
          content: args.message,
        },
      });

      await ctx.redis.publish("messageAdded", message.id);
      return true;
    },
  },
  Subscription: {
    listenToEchoes: {
      subscribe(info, args, ctx) {
        return (async function* () {
          for await (const id of ctx.redis.asyncIterator(
            `messageAdded`
          ) as any) {
            const message = await ctx.db.message.findUnique({
              where: {
                id,
              },
            });
            yield message.content;
          }
        })();
      },
      resolve(res) {
        return res;
      },
    },
    connectedDevices: {
      subscribe() {
        return (async function* () {
          yield [
            {
              id: "3",
              language: Language.Typescript,
              secondsConnected: 7,
            },
            {
              id: "4",
              language: Language.Typescript,
              secondsConnected: 10,
            },
          ];
        })();
      },
      resolve(res) {
        return res;
      },
    },
  },
};
