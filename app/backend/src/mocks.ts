import { BlockTypes, getBlocks } from "@memorix/codegen/block";
import { ValueTypes } from "@memorix/codegen/value";
import fs from "fs";
import path from "path";
import {
  ActionOperation,
  ConnectedDevice,
  Language,
  Schema,
  SchemaPlatform,
  SchemaPlatformType,
  SchemaResource,
  SchemaResourceType,
  TaskOperationType,
} from "./schema-resolvers-generated";

const getConnectedDevices: () => Promise<
  Array<{
    base: ConnectedDevice;
    platformIds: string[];
    resourceIds: string[];
    actions: {
      id: string;
      operations: ActionOperation[];
    }[];
  }>
> = async () => {
  return [
    {
      base: {
        id: "iot1",
        language: Language.Python,
        name: "IOT 1",
        secondsConnected: 12,
      },
      platformIds: ["p2p", "redis"],
      resourceIds: ["redis_task", "redis_pubsub"],
      actions: [
        {
          id: "redis_task_userAdded",
          operations: [
            {
              __typename: "TaskOperation",
              type: TaskOperationType.Queue,
              createTimeMsAgo: 2000,
              timeInMs: 212,
              timeCallbackTook: 1000,
            },
          ],
        },
      ],
    },
    {
      base: {
        id: "iot2",
        language: Language.Python,
        name: "IOT 2",
        secondsConnected: 39,
      },
      platformIds: ["p2p", "redis"],
      resourceIds: ["redis_task", "redis_pubsub"],
      actions: [],
    },
    {
      base: {
        id: "iot3",
        language: Language.Python,
        name: "IOT 3",
        secondsConnected: 45,
      },
      platformIds: ["p2p", "redis"],
      resourceIds: ["redis_task", "redis_pubsub"],
      actions: [],
    },
    {
      base: {
        id: "iot4",
        language: Language.Python,
        name: "IOT 4",
        secondsConnected: 3,
      },
      platformIds: ["p2p", "redis"],
      resourceIds: ["redis_task", "redis_pubsub"],
      actions: [],
    },
    {
      base: {
        id: "be1",
        language: Language.Typescript,
        name: "Graphql server",
        secondsConnected: 2000,
      },
      platformIds: ["redis"],
      resourceIds: ["redis_cache", "redis_task", "redis_pubsub"],
      actions: [],
    },
    {
      base: {
        id: "be2",
        language: Language.Typescript,
        name: "Redis listener",
        secondsConnected: 2101,
      },
      platformIds: ["redis"],
      resourceIds: ["redis_cache", "redis_task", "redis_pubsub"],
      actions: [],
    },
    {
      base: {
        id: "be3",
        language: Language.Python,
        name: "Algo instance",
        secondsConnected: 3007,
      },
      platformIds: ["redis"],
      resourceIds: ["redis_cache", "redis_task"],
      actions: [],
    },
  ];
};

export const getSchema: () => Promise<Schema> = async () => {
  const schemaPath = path.resolve(__dirname, "r2-schema.memorix");
  const schema = await (await fs.promises.readFile(schemaPath)).toString();
  const blocks = getBlocks(schema);
  const connectedDevices = await getConnectedDevices();

  return {
    connectedDevices: connectedDevices.map((x) => ({
      ...x.base,
      graph: x.platformIds.map((platformId) => ({
        platformId,
        resources: x.resourceIds
          .filter((y) => y.startsWith(platformId))
          .map((resourceId) => ({
            resourceId,
            actions: x.actions
              .filter((y) => y.id.startsWith(resourceId))
              .map((a) => ({
                actionId: a.id,
                operations: a.operations,
              })),
          })),
      })),
    })),
    platforms: [
      {
        id: "redis",
        type: SchemaPlatformType.Redis,
        models: blocks.reduce<SchemaPlatform["models"]>((agg, b) => {
          if (b.type !== BlockTypes.model) {
            return agg;
          }
          return [
            ...agg,
            {
              id: b.name,
              name: b.name,
              value: {
                isOptional: false,
                type: ValueTypes.object,
                properties: b.properties,
              },
            },
          ];
        }, []),
        connectedDevices: connectedDevices
          .filter((x) => x.platformIds.indexOf("redis") !== -1)
          .map((x) => ({
            ...x.base,
            graph: x.resourceIds
              .filter((y) => y.startsWith("redis"))
              .map((resourceId) => ({
                resourceId,
                actions: x.actions
                  .filter((y) => y.id.startsWith(resourceId))
                  .map((a) => ({
                    actionId: a.id,
                    operations: a.operations,
                  })),
              })),
          })),
        resources: blocks.reduce<SchemaPlatform["resources"]>((agg, b) => {
          if (b.type === BlockTypes.enum || b.type === BlockTypes.model) {
            return agg;
          }
          const schemaResourceType = {
            [BlockTypes.cache]: SchemaResourceType.Cache,
            [BlockTypes.pubsub]: SchemaResourceType.Pubsub,
            [BlockTypes.task]: SchemaResourceType.Task,
          }[b.type];

          const actionTypeName = {
            [BlockTypes.cache]: "SchemaCache",
            [BlockTypes.pubsub]: "SchemaPubsub",
            [BlockTypes.task]: "SchemaTask",
          }[b.type];

          const schemaResourceId = `redis_${
            {
              [BlockTypes.cache]: "cache",
              [BlockTypes.pubsub]: "pubsub",
              [BlockTypes.task]: "task",
            }[b.type]
          }`;

          const aggItem =
            agg.find((x) => x.type === schemaResourceType) ??
            ({
              id: schemaResourceId,
              type: schemaResourceType,
              actions: [],
              connectedDevices: connectedDevices
                .filter((x) => x.resourceIds.indexOf(schemaResourceId) !== -1)
                .map((x) => ({
                  ...x.base,
                  graph: x.actions
                    .filter((a) => a.id.startsWith(schemaResourceId))
                    .map((a) => ({
                      actionId: a.id,
                      operations: a.operations,
                    })),
                })),
            } as SchemaResource);

          return [
            ...agg.filter((x) => x.type !== schemaResourceType),
            {
              ...aggItem,
              actions: aggItem.actions.concat(
                b.values.map((bv) => ({
                  id: `${schemaResourceId}_${bv.name}`,
                  name: bv.name,
                  resource: {
                    id: schemaResourceId,
                    type: schemaResourceType,
                    actions: [],
                    connectedDevices: [],
                  },
                  data: {
                    __typename: actionTypeName,
                    connectedDevices: connectedDevices
                      .filter((x) =>
                        x.actions.some(
                          (a) => a.id === `${schemaResourceId}_${bv.name}`
                        )
                      )
                      .map((x) => ({
                        ...x.base,
                        operations: x.actions.find(
                          (a) => a.id === `${schemaResourceId}_${bv.name}`
                        )!.operations,
                      })),
                    key: bv.key,
                    payload: bv.payload,
                    returns: (bv as any).returns,
                  },
                })) as typeof aggItem.actions
              ),
            },
          ];
        }, []),
      },
      {
        id: "p2p",
        type: SchemaPlatformType.P2p,
        models: [],
        connectedDevices: [],
        resources: [],
      },
    ],
  };
};
