import { Resolvers } from "./schema-resolvers-generated";

export const resolvers: Resolvers = {
  Query: {
    test() {
      return true;
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
  },
};
