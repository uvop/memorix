import { getOperations, getSchema } from "./mocks";
import { Resolvers, Subscription } from "./schema-resolvers-generated";

export const resolvers: Resolvers = {
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
      const platformId = args.id;
      const schema = await getSchema();
      const platform = schema.platforms.find((x) => x.id === platformId);

      if (!platform) {
        throw new Error(`Couldn't find platform with id "${platformId}".`);
      }

      return platform;
    },
    async resource(info, args) {
      const resourceId = args.id;

      const match = /(?<platformId>.*)_(.*)/g.exec(resourceId);
      if (!match || !match.groups) {
        throw new Error(`Couldn't find resource with id "${resourceId}".`);
      }
      const { platformId } = match.groups;

      const schema = await getSchema();
      const resource = schema.platforms
        .find((x) => x.id === platformId)
        ?.resources.find((x) => x.id === resourceId);

      if (!resource) {
        throw new Error(`Couldn't find resource with id "${resourceId}".`);
      }

      return resource;
    },
    async action(info, args) {
      const actionId = args.id;
      const match = /(?<platformId>.*)_(?<resourceName>.*)_(.*)/g.exec(
        actionId
      );
      if (!match || !match.groups) {
        throw new Error(`Couldn't find action with id "${actionId}".`);
      }
      const { platformId, resourceName } = match.groups;
      const resourceId = `${platformId}_${resourceName}`;

      const schema = await getSchema();
      const action = schema.platforms
        .find((x) => x.id === platformId)
        ?.resources.find((x) => x.id === resourceId)
        ?.actions.find((x) => x.id === actionId);

      if (!action) {
        throw new Error(`Couldn't find action with id "${actionId}".`);
      }

      return action;
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
    schemaOperations: {
      subscribe() {
        return (async function* (): AsyncGenerator<
          Subscription["schemaOperations"],
          undefined,
          void
        > {
          const operations = await getOperations();
          yield operations.map((x) => ({
            platformId: x.platformId,
            operation: x.base,
          }));

          return undefined;
        })();
      },
      resolve(res: any) {
        return res;
      },
    },
    schemaLastOperations: {
      subscribe() {
        return (async function* (): AsyncGenerator<
          Subscription["schemaLastOperations"],
          undefined,
          void
        > {
          const operations = await getOperations();
          yield operations.map((x) => ({
            platformId: x.platformId,
            operation: x.base,
          }));

          return undefined;
        })();
      },
      resolve(res: any) {
        return res;
      },
    },
    platformOperations: {
      subscribe(info, args) {
        return (async function* (): AsyncGenerator<
          Subscription["platformOperations"],
          undefined,
          void
        > {
          const { id: platformId } = args;
          const operations = await getOperations();
          yield operations
            .filter((x) => x.platformId === platformId)
            .map((x) => ({
              resourceId: x.resourceId,
              operation: x.base,
            }));

          return undefined;
        })();
      },
      resolve(res: any) {
        return res;
      },
    },
    platformLastOperations: {
      subscribe(info, args) {
        return (async function* (): AsyncGenerator<
          Subscription["platformLastOperations"],
          undefined,
          void
        > {
          const { id: platformId } = args;
          const operations = await getOperations();
          yield operations
            .filter((x) => x.platformId === platformId)
            .map((x) => ({
              resourceId: x.resourceId,
              operation: x.base,
            }));

          return undefined;
        })();
      },
      resolve(res: any) {
        return res;
      },
    },
    resourceOperations: {
      subscribe(info, args) {
        return (async function* (): AsyncGenerator<
          Subscription["resourceOperations"],
          undefined,
          void
        > {
          const { id: resourceId } = args;
          const operations = await getOperations();
          yield operations
            .filter((x) => x.resourceId === resourceId)
            .map((x) => ({
              actionId: x.actionsId,
              operation: x.base,
            }));

          return undefined;
        })();
      },
      resolve(res: any) {
        return res;
      },
    },
    resourceLastOperations: {
      subscribe(info, args) {
        return (async function* (): AsyncGenerator<
          Subscription["resourceLastOperations"],
          undefined,
          void
        > {
          const { id: resourceId } = args;
          const operations = await getOperations();
          yield operations
            .filter((x) => x.resourceId === resourceId)
            .map((x) => ({
              actionId: x.actionsId,
              operation: x.base,
            }));

          return undefined;
        })();
      },
      resolve(res: any) {
        return res;
      },
    },
    actionOperations: {
      subscribe(info, args) {
        return (async function* (): AsyncGenerator<
          Subscription["actionOperations"],
          undefined,
          void
        > {
          const { id: actionId } = args;
          const operations = await getOperations();
          yield operations
            .filter((x) => x.actionsId === actionId)
            .map((x) => x.base);

          return undefined;
        })();
      },
      resolve(res: any) {
        return res;
      },
    },
    actionLastOperation: {
      subscribe(info, args) {
        return (async function* (): AsyncGenerator<
          Subscription["actionLastOperation"],
          undefined,
          void
        > {
          const { id: actionId } = args;
          const operations = await getOperations();
          const actionOperations = operations
            .filter((x) => x.actionsId === actionId)
            .map((x) => x.base);

          if (actionOperations.length === 0) {
            throw new Error(`Couldn't find op for actionId "${actionId}"`);
          }

          yield actionOperations[0];

          return undefined;
        })();
      },
      resolve(res: any) {
        return res;
      },
    },
  },
};
