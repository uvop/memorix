import { getSchema } from "./mocks";
import { Resolvers } from "./schema-resolvers-generated";

export const resolvers: Resolvers = {
  SchemaActionData: {
    // eslint-disable-next-line no-underscore-dangle
    __resolveType(res) {
      // eslint-disable-next-line no-underscore-dangle
      return res.__typename!;
    },
  },
  ActionOperation: {
    // eslint-disable-next-line no-underscore-dangle
    __resolveType(res) {
      // eslint-disable-next-line no-underscore-dangle
      return res.__typename!;
    },
  },
  Query: {
    test() {
      return true;
    },
    async schema() {
      const schema = await getSchema();
      return schema;
    },
    async platform(info, args) {
      const schema = await getSchema();

      return schema.platforms.find((x) => x.id === args.id) ?? null;
    },
    async resrouce(info, args) {
      const match = /(?<platformId>.*)_(.*)/g.exec(args.id);
      if (!match || !match.groups) {
        return null;
      }
      const { platformId } = match.groups;

      const schema = await getSchema();

      return (
        schema.platforms
          .find((x) => x.id === platformId)
          ?.resources.find((x) => x.id === args.id) ?? null
      );
    },
    async action(info, args) {
      const match = /(?<platformId>.*)_(?<resourceId>.*)_(.*)/g.exec(args.id);
      if (!match || !match.groups) {
        return null;
      }
      const { platformId, resourceId } = match.groups;

      const schema = await getSchema();

      return (
        schema.platforms
          .find((x) => x.id === platformId)
          ?.resources.find((x) => x.id === resourceId)
          ?.actions.find((x) => x.id === args.id) ?? null
      );
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
            if (message) {
              yield message.content;
            }
          }
        })();
      },
      resolve(res: any) {
        return res;
      },
    },
  },
};
