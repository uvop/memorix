// import { BlockTypes, getBlocks } from "@memorix/codegen/block";
// import { ValueTypes } from "@memorix/codegen/value";
// import fs from "fs";
// import path from "path";
import { Resolvers } from "./schema-resolvers-generated";

export const resolvers: Resolvers = {
  SchemaActionData: {
    // eslint-disable-next-line no-underscore-dangle
    __resolveType(res) {
      // if ("cache" in res) {
      //   return "PlatformDataRedis";
      // }

      return "SchemaCache";
    },
  },
  ActionOperation: {
    // eslint-disable-next-line no-underscore-dangle
    __resolveType(res) {
      // if ("cache" in res) {
      //   return "PlatformDataRedis";
      // }

      return "CacheOperation";
    },
  },
  Query: {
    test() {
      return true;
    },
    // async schema() {
    //   const schemaPath = path.resolve(__dirname, "r2-schema.memorix");
    //   const schema = await (await fs.promises.readFile(schemaPath)).toString();
    //   const blocks = getBlocks(schema);

    //   return {
    //     platforms: [
    //       {
    //         id: "p2p",
    //         type: PlatformType.P2p,
    //         data: {
    //           models: [],
    //           pubsub: [],
    //         },
    //       },
    //       {
    //         id: "redis",
    //         type: PlatformType.Redis,
    //         data: {
    //           models: blocks.reduce<PlatformDataRedis["models"]>((agg, b) => {
    //             if (b.type !== BlockTypes.model) {
    //               return agg;
    //             }
    //             return [
    //               ...agg,
    //               {
    //                 id: b.name,
    //                 name: b.name,
    //                 value: {
    //                   isOptional: false,
    //                   type: ValueTypes.object,
    //                   properties: b.properties,
    //                 },
    //               },
    //             ];
    //           }, []),
    //           cache: blocks.reduce<PlatformDataRedis["cache"]>((agg, b) => {
    //             if (b.type !== BlockTypes.cache) {
    //               return agg;
    //             }
    //             return [
    //               ...agg,
    //               ...b.values.map((bc) => {
    //                 return {
    //                   id: bc.name,
    //                   name: bc.name,
    //                   key: bc.key,
    //                   payload: bc.payload,
    //                   operations: [],
    //                 };
    //               }),
    //             ];
    //           }, []),
    //           pubsub: blocks.reduce<PlatformDataRedis["pubsub"]>((agg, b) => {
    //             if (b.type !== BlockTypes.pubsub) {
    //               return agg;
    //             }
    //             return [
    //               ...agg,
    //               ...b.values.map((bc) => {
    //                 return {
    //                   id: bc.name,
    //                   name: bc.name,
    //                   key: bc.key,
    //                   payload: bc.payload,
    //                   operations: [],
    //                 };
    //               }),
    //             ];
    //           }, []),
    //           task: blocks.reduce<PlatformDataRedis["task"]>((agg, b) => {
    //             if (b.type !== BlockTypes.task) {
    //               return agg;
    //             }
    //             return [
    //               ...agg,
    //               ...b.values.map((bc) => {
    //                 return {
    //                   id: bc.name,
    //                   name: bc.name,
    //                   key: bc.key,
    //                   payload: bc.payload,
    //                   returns: bc.returns,
    //                   operations: [],
    //                 };
    //               }),
    //             ];
    //           }, []),
    //         },
    //       },
    //     ],
    //   };
    // },
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
