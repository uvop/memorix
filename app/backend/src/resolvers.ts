import { BlockTypes, getBlocks } from "@memorix/codegen/block";
import fs from "fs";
import path from "path";
import { Language, Resolvers, Schema } from "./schema-resolvers-generated";

export const resolvers: Resolvers = {
  // SchemaValueData: {
  //   // eslint-disable-next-line no-underscore-dangle
  //   __resolveType(res) {
  //     if ("name" in res) {
  //       return "SchemaValueDataSimple";
  //     }
  //     if ("propertyValueIds" in res) {
  //       return "SchemaValueDataObject";
  //     }

  //     return "SchemaValueDataArray";
  //   },
  // },
  Query: {
    test() {
      return true;
    },
    async schema() {
      const schemaPath = path.resolve(__dirname, "r2-schema.memorix");
      const schema = await (await fs.promises.readFile(schemaPath)).toString();
      const blocks = getBlocks(schema);

      return {
        models: [],
        cache: blocks.reduce<Schema["cache"]>((agg, b) => {
          if (b.type !== BlockTypes.cache) {
            return agg;
          }
          return [
            ...agg,
            ...b.values.map((bc) => {
              return {
                id: bc.name,
                name: bc.name,
                key: bc.key,
                payload: bc.payload,
              };
            }),
          ];
        }, []),
        pubsub: [],
        task: [],
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
