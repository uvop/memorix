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
    actionsIds: string[];
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
      actionsIds: ["redis_task_registerPr"],
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
      actionsIds: ["redis_task_registerPr"],
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
      actionsIds: ["redis_task_registerPr"],
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
      actionsIds: ["redis_task_registerPr"],
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
      actionsIds: ["redis_task_registerPr"],
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
      actionsIds: [],
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
      actionsIds: [],
    },
  ];
};

export const getOperations: () => Promise<
  Array<{
    base: ActionOperation;
    platformId: string;
    resourceId: string;
    actionsId: string;
  }>
> = async () => {
  return [
    {
      platformId: "redis",
      resourceId: "redis_task",
      actionsId: "redis_task_registerPr",
      base: {
        __typename: "TaskOperation",
        connectedDeviceId: "be1",
        createMsAgo: 7000,
        type: TaskOperationType.Dequeue,
      },
    },
    {
      platformId: "redis",
      resourceId: "redis_task",
      actionsId: "redis_task_registerPr",
      base: {
        __typename: "TaskOperation",
        connectedDeviceId: "iot1",
        createMsAgo: 5000,
        type: TaskOperationType.Queue,
        payload: {
          name: "IOT 1",
          geo_location: {
            lat: 32,
            lng: 34,
          },
        },
        queueTo: {
          connectedDeviceId: "be1",
          callbackStartedMsAgo: 4444,
          callbackEndedMsAgo: 3912,
          returns: "session_token",
          returnCallbackStartedMsAgo: 2121,
          returnCallbackEndedMsAgo: 1122,
        },
      },
    },
  ];
};

export const getSchema: () => Promise<Schema> = async () => {
  const schemaPath = path.resolve(__dirname, "r2-schema.memorix");
  const schema = await (await fs.promises.readFile(schemaPath)).toString();
  const blocks = getBlocks(schema);
  const connectedDevices = await getConnectedDevices();

  return {
    connectedDevices: connectedDevices.map((x) => x.base),
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
          .map((x) => x.base),
        resources: blocks.reduce<SchemaPlatform["resources"]>((agg, b) => {
          if (b.type === BlockTypes.enum || b.type === BlockTypes.model) {
            return agg;
          }
          const schemaResourceType = {
            [BlockTypes.cache]: SchemaResourceType.Cache,
            [BlockTypes.pubsub]: SchemaResourceType.Pubsub,
            [BlockTypes.task]: SchemaResourceType.Task,
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
                .map((x) => x.base),
            } as SchemaResource);

          return [
            ...agg.filter((x) => x.type !== schemaResourceType),
            {
              ...aggItem,
              actions: aggItem.actions.concat(
                b.values.map((bv) => {
                  const schemaActionId = `${schemaResourceId}_${bv.name}`;
                  return {
                    id: schemaActionId,
                    name: bv.name,
                    resource: {
                      id: schemaResourceId,
                      type: schemaResourceType,
                      actions: [],
                      connectedDevices: [],
                    },
                    connectedDevices: connectedDevices
                      .filter(
                        (x) => x.actionsIds.indexOf(schemaActionId) !== -1
                      )
                      .map((x) => x.base),
                    key: bv.key,
                    payload: bv.payload,
                    returns: (bv as any).returns,
                  };
                }) as typeof aggItem.actions
              ),
            },
          ];
        }, []),
      },
      {
        id: "p2p",
        type: SchemaPlatformType.P2p,
        models: [],
        connectedDevices: connectedDevices
          .filter((x) => x.platformIds.indexOf("p2p") !== -1)
          .map((x) => x.base),
        resources: [],
      },
    ],
  };
};
