/* eslint-disable no-await-in-loop */
import { BlockTypes, getBlocks } from "@memorix/codegen/block";
import { ValueTypes } from "@memorix/codegen/value";
import fs from "fs";
import path from "path";
import {
  ActionOperation,
  ActionOperationType,
  CacheOperationType,
  ConnectedDevice,
  Language,
  PubsubOperationType,
  Schema,
  SchemaPlatform,
  SchemaPlatformType,
  SchemaResource,
  SchemaResourceType,
  TaskOperationType,
} from "./schema-resolvers-generated";

const randBetweenInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min) + min);
};
const randBetween = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

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
      actionsIds: [
        "redis_task_registerPr",
        "redis_task_sendLocalizationResult",
        "redis_pubsub_getOperation",
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
      actionsIds: [
        "redis_task_registerPr",
        "redis_task_sendLocalizationResult",
        "redis_pubsub_getOperation",
      ],
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
      actionsIds: [
        "redis_task_registerPr",
        "redis_task_sendLocalizationResult",
        "redis_pubsub_getOperation",
      ],
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
      actionsIds: [
        "redis_task_registerPr",
        "redis_task_sendLocalizationResult",
        "redis_pubsub_getOperation",
      ],
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
      actionsIds: [
        "redis_task_algo",
        "redis_cache_localizationResult",
        "redis_task_registerPr",
        "redis_task_sendLocalizationResult",
        "redis_pubsub_getOperation",
      ],
    },
    {
      base: {
        id: "be2",
        language: Language.Python,
        name: "Algo instance",
        secondsConnected: 3007,
      },
      platformIds: ["redis"],
      resourceIds: ["redis_cache", "redis_task"],
      actionsIds: ["redis_task_algo", "redis_cache_localizationResult"],
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
        id: "before_1",
        actionId: "redis_task_registerPr",
        connectedDeviceId: "be1",
        createMsAgo: 30000 + randBetweenInt(-200, 200),
        type: ActionOperationType.Task,
        data: {
          // eslint-disable-next-line @typescript-eslint/prefer-as-const
          __typename: "TaskOperation" as "TaskOperation",
          type: TaskOperationType.Dequeue,
        },
      },
    },
    {
      platformId: "redis",
      resourceId: "redis_task",
      actionsId: "redis_task_sendLocalizationResult",
      base: {
        id: "before_2",
        actionId: "redis_task_sendLocalizationResult",
        connectedDeviceId: "be1",
        createMsAgo: 30000 + randBetweenInt(-200, 200),
        type: ActionOperationType.Task,
        data: {
          // eslint-disable-next-line @typescript-eslint/prefer-as-const
          __typename: "TaskOperation" as "TaskOperation",
          type: TaskOperationType.Dequeue,
        },
      },
    },
    {
      platformId: "redis",
      resourceId: "redis_task",
      actionsId: "redis_task_algo",
      base: {
        id: "before_3",
        actionId: "redis_task_algo",
        connectedDeviceId: "be2",
        createMsAgo: 30000 + randBetweenInt(-200, 200),
        type: ActionOperationType.Task,
        data: {
          // eslint-disable-next-line @typescript-eslint/prefer-as-const
          __typename: "TaskOperation" as "TaskOperation",
          type: TaskOperationType.Dequeue,
        },
      },
    },
    {
      platformId: "redis",
      resourceId: "redis_pubsub",
      actionsId: "redis_pubsub_getOperation",
      base: {
        id: "before_4",
        actionId: "redis_pubsub_getOperation",
        connectedDeviceId: `be1`,
        createMsAgo: 10000 + randBetweenInt(-200, 200),
        type: ActionOperationType.Pubsub,
        data: {
          // eslint-disable-next-line @typescript-eslint/prefer-as-const
          __typename: "PubsubOperation" as "PubsubOperation",
          type: PubsubOperationType.Publish,
          payload: {
            type: "START_LOCALIZATION",
            localizationData: {
              token: `localization_token`,
              name: "field test",
              detection_type: "LTE4G",
              freq: 30,
              rate: 10,
              bw: 20,
              duration: 1,
              freq_start_low: 10,
              freq_end_low: 20,
              freq_start_high: 30,
              freq_end_high: 40,
              is_record: true,
            },
          },
          publishTo: Array.from({ length: 4 })
            .map((_, i) => i + 1)
            .map((num) => {
              const connectedDeviceId = `iot${num}`;
              return {
                connectedDeviceId,
                callbackStartedMsAgo: 9000 + randBetweenInt(-200, 200),
                callbackEndedMsAgo: 8500 + randBetweenInt(-200, 200),
              };
            }),
        },
      },
    },
    {
      platformId: "redis",
      resourceId: "redis_task",
      actionsId: "redis_task_algo",
      base: {
        id: "before_5",
        actionId: "redis_task_algo",
        connectedDeviceId: "be1",
        createMsAgo: 3720,
        type: ActionOperationType.Task,
        data: {
          // eslint-disable-next-line @typescript-eslint/prefer-as-const
          __typename: "TaskOperation" as "TaskOperation",
          type: TaskOperationType.Queue,
          payload: {
            resultKeys: [`localization_3`, `localization_4`],
          },
          queueTo: {
            connectedDeviceId: "be2",
            callbackStartedMsAgo: 3712,
            callbackEndedMsAgo: 3612,
            returns: {
              geo_location: {
                lat: 32 + randBetween(-2, 2),
                lng: 34 + randBetween(-2, 2),
              },
            },
            returnCallbackStartedMsAgo: 3600,
            returnCallbackEndedMsAgo: 3450,
          },
        },
      },
    },
    {
      platformId: "redis",
      resourceId: "redis_task",
      actionsId: "redis_task_algo",
      base: {
        id: "before_6",
        actionId: "redis_task_algo",
        connectedDeviceId: "be1",
        createMsAgo: 3650,
        type: ActionOperationType.Task,
        data: {
          // eslint-disable-next-line @typescript-eslint/prefer-as-const
          __typename: "TaskOperation" as "TaskOperation",
          type: TaskOperationType.Queue,
          payload: {
            resultKeys: [`localization_3`, `localization_4`],
          },
          queueTo: {
            connectedDeviceId: "be2",
            callbackStartedMsAgo: 3610,
            callbackEndedMsAgo: 3500,
            returns: {
              geo_location: {
                lat: 32 + randBetween(-2, 2),
                lng: 34 + randBetween(-2, 2),
              },
            },
            returnCallbackStartedMsAgo: 3498,
            returnCallbackEndedMsAgo: 3400,
          },
        },
      },
    },
    ...Array.from({ length: 4 })
      .map((_, i) => i + 1)
      .map((num) => {
        const connectedDeviceId = `iot${num}`;
        return [
          {
            platformId: "redis",
            resourceId: "redis_task",
            actionsId: "redis_task_registerPr",
            base: {
              id: `before_iot_${num}_1`,
              actionId: "redis_task_registerPr",
              connectedDeviceId,
              createMsAgo: 20000 + randBetweenInt(-200, 200),
              type: ActionOperationType.Task,
              data: {
                // eslint-disable-next-line @typescript-eslint/prefer-as-const
                __typename: "TaskOperation" as "TaskOperation",
                type: TaskOperationType.Queue,
                payload: {
                  name: `IOT ${num}`,
                  geo_location: {
                    lat: 32 + randBetween(-2, 2),
                    lng: 34 + randBetween(-2, 2),
                  },
                },
                queueTo: {
                  connectedDeviceId: "be1",
                  callbackStartedMsAgo: 18000 + randBetweenInt(-200, 200),
                  callbackEndedMsAgo: 17700 + randBetweenInt(-200, 200),
                  returns: `session_token_${num}`,
                  returnCallbackStartedMsAgo: 16000 + randBetweenInt(-200, 200),
                  returnCallbackEndedMsAgo: 15500 + randBetweenInt(-200, 200),
                },
              },
            },
          },
          {
            platformId: "redis",
            resourceId: "redis_pubsub",
            actionsId: "redis_pubsub_getOperation",
            base: {
              id: `before_iot_${num}_2`,
              actionId: "redis_pubsub_getOperation",
              connectedDeviceId,
              createMsAgo: 15000 + randBetweenInt(-200, 200),
              type: ActionOperationType.Pubsub,
              data: {
                // eslint-disable-next-line @typescript-eslint/prefer-as-const
                __typename: "PubsubOperation" as "PubsubOperation",
                type: PubsubOperationType.Subscribe,
                key: `session_token_${num}`,
              },
            },
          },
        ];
      })
      .flat(),
  ];
};

const sleep = (num: number) =>
  new Promise((res) => {
    setTimeout(res, num);
  });

export async function* getOperationsGenerator(): AsyncGenerator<
  Array<{
    base: ActionOperation;
    platformId: string;
    resourceId: string;
    actionsId: string;
  }>,
  undefined,
  void
> {
  for (let i = 0; i <= 999; i += 1) {
    for (let num = 1; num <= 4; num += 1) {
      const connectedDeviceId = `iot${num}`;
      yield [
        {
          platformId: "redis",
          resourceId: "redis_task",
          actionsId: "redis_task_sendLocalizationResult",
          base: {
            id: `after_iot_${num}_${i}_1`,
            actionId: "redis_task_sendLocalizationResult",
            connectedDeviceId,
            createMsAgo: 10,
            type: ActionOperationType.Task,
            data: {
              // eslint-disable-next-line @typescript-eslint/prefer-as-const
              __typename: "TaskOperation" as "TaskOperation",
              type: TaskOperationType.Queue,
              payload: {
                token: `localization_token`,
                result: {
                  serial_num: num,
                  recv_time: "10",
                  red_peaks: [0, 1, 2],
                  red_widths: [1, 2, 3],
                  red_heights: [1, 2, 3],
                  blue_peaks: [1, 2, 3],
                  blue_widths: [1, 2, 3],
                  blue_heights: [1, 2, 3],
                  cp_peaks: [1, 2, 3],
                  cp_widths: [1, 2, 3],
                  cp_heights: [1, 2, 3],
                  is_detect_controller: true,
                  red_max: 7,
                  blue_max: 7,
                  cp_max: 7,
                  i_max: 7,
                  q_max: 7,
                  is_detect_red: true,
                  is_detect_blue: true,
                  is_detect_cp: true,
                  is_clock_alignment: true,
                  iteration_num: 7,
                  iteration_total_time: 7,
                  processing_time: 7,
                  recv_signal_time: 7,
                  sync_delay: 7,
                },
              },
            },
          },
        },
      ];
      const sleep1 = randBetweenInt(300, 1000);
      await sleep(sleep1);
      yield [
        {
          platformId: "redis",
          resourceId: "redis_task",
          actionsId: "redis_task_sendLocalizationResult",
          base: {
            id: `after_iot_${num}_${i}_1`,
            actionId: "redis_task_sendLocalizationResult",
            connectedDeviceId,
            createMsAgo: 10 + sleep1,
            type: ActionOperationType.Task,
            data: {
              // eslint-disable-next-line @typescript-eslint/prefer-as-const
              __typename: "TaskOperation" as "TaskOperation",
              type: TaskOperationType.Queue,
              payload: {
                token: `localization_token`,
                result: {
                  serial_num: num,
                  recv_time: "10",
                  red_peaks: [0, 1, 2],
                  red_widths: [1, 2, 3],
                  red_heights: [1, 2, 3],
                  blue_peaks: [1, 2, 3],
                  blue_widths: [1, 2, 3],
                  blue_heights: [1, 2, 3],
                  cp_peaks: [1, 2, 3],
                  cp_widths: [1, 2, 3],
                  cp_heights: [1, 2, 3],
                  is_detect_controller: true,
                  red_max: 7,
                  blue_max: 7,
                  cp_max: 7,
                  i_max: 7,
                  q_max: 7,
                  is_detect_red: true,
                  is_detect_blue: true,
                  is_detect_cp: true,
                  is_clock_alignment: true,
                  iteration_num: 7,
                  iteration_total_time: 7,
                  processing_time: 7,
                  recv_signal_time: 7,
                  sync_delay: 7,
                },
              },
              queueTo: {
                connectedDeviceId: "be1",
                callbackStartedMsAgo: 10,
              },
            },
          },
        },
      ];
      await sleep(randBetweenInt(300, 1000));
      yield [
        {
          platformId: "redis",
          resourceId: "redis_cache",
          actionsId: "redis_cache_localizationResult",
          base: {
            id: `after_iot_${num}_${i}_2`,
            actionId: "redis_cache_localizationResult",
            connectedDeviceId: "be1",
            createMsAgo: 7,
            type: ActionOperationType.Cache,
            data: {
              // eslint-disable-next-line @typescript-eslint/prefer-as-const
              __typename: "CacheOperation" as "CacheOperation",
              type: CacheOperationType.Set,
              key: `localization_${num}`,
              payload: {
                serial_num: num,
                recv_time: "10",
                red_peaks: [0, 1, 2],
                red_widths: [1, 2, 3],
                red_heights: [1, 2, 3],
                blue_peaks: [1, 2, 3],
                blue_widths: [1, 2, 3],
                blue_heights: [1, 2, 3],
                cp_peaks: [1, 2, 3],
                cp_widths: [1, 2, 3],
                cp_heights: [1, 2, 3],
                is_detect_controller: true,
                red_max: 7,
                blue_max: 7,
                cp_max: 7,
                i_max: 7,
                q_max: 7,
                is_detect_red: true,
                is_detect_blue: true,
                is_detect_cp: true,
                is_clock_alignment: true,
                iteration_num: 7,
                iteration_total_time: 7,
                processing_time: 7,
                recv_signal_time: 7,
                sync_delay: 7,
              },
            },
          },
        },
      ];
      const sleep2 = randBetweenInt(300, 1000);
      await sleep(sleep2);
      yield [
        {
          platformId: "redis",
          resourceId: "redis_task",
          actionsId: "redis_task_sendLocalizationResult",
          base: {
            id: `after_iot_${num}_${i}_1`,
            actionId: "redis_task_sendLocalizationResult",
            connectedDeviceId,
            createMsAgo: 10 + sleep1 + sleep2,
            type: ActionOperationType.Task,
            data: {
              // eslint-disable-next-line @typescript-eslint/prefer-as-const
              __typename: "TaskOperation" as "TaskOperation",
              type: TaskOperationType.Queue,
              payload: {
                token: `localization_token`,
                result: {
                  serial_num: num,
                  recv_time: "10",
                  red_peaks: [0, 1, 2],
                  red_widths: [1, 2, 3],
                  red_heights: [1, 2, 3],
                  blue_peaks: [1, 2, 3],
                  blue_widths: [1, 2, 3],
                  blue_heights: [1, 2, 3],
                  cp_peaks: [1, 2, 3],
                  cp_widths: [1, 2, 3],
                  cp_heights: [1, 2, 3],
                  is_detect_controller: true,
                  red_max: 7,
                  blue_max: 7,
                  cp_max: 7,
                  i_max: 7,
                  q_max: 7,
                  is_detect_red: true,
                  is_detect_blue: true,
                  is_detect_cp: true,
                  is_clock_alignment: true,
                  iteration_num: 7,
                  iteration_total_time: 7,
                  processing_time: 7,
                  recv_signal_time: 7,
                  sync_delay: 7,
                },
              },
              queueTo: {
                connectedDeviceId: "be1",
                callbackStartedMsAgo: 10 + sleep2,
                callbackEndedMsAgo: 10,
              },
            },
          },
        },
      ];
      await sleep(randBetweenInt(300, 1000));
    }
    yield [
      {
        platformId: "redis",
        resourceId: "redis_task",
        actionsId: "redis_task_algo",
        base: {
          actionId: "redis_task_algo",
          id: `after_iot_${i}_1`,
          connectedDeviceId: "be1",
          createMsAgo: 5,
          type: ActionOperationType.Task,
          data: {
            // eslint-disable-next-line @typescript-eslint/prefer-as-const
            __typename: "TaskOperation" as "TaskOperation",
            type: TaskOperationType.Queue,
            payload: {
              resultKeys: [
                `localization_1`,
                `localization_2`,
                `localization_3`,
                `localization_4`,
              ],
            },
          },
        },
      },
    ];

    const sleep1 = randBetweenInt(300, 1000);
    await sleep(sleep1);
    yield [
      {
        platformId: "redis",
        resourceId: "redis_task",
        actionsId: "redis_task_algo",
        base: {
          actionId: "redis_task_algo",
          id: `after_iot_${i}_1`,
          connectedDeviceId: "be1",
          createMsAgo: 5 + sleep1,
          type: ActionOperationType.Task,
          data: {
            // eslint-disable-next-line @typescript-eslint/prefer-as-const
            __typename: "TaskOperation" as "TaskOperation",
            type: TaskOperationType.Queue,
            payload: {
              resultKeys: [
                `localization_1`,
                `localization_2`,
                `localization_3`,
                `localization_4`,
              ],
            },
            queueTo: {
              connectedDeviceId: "be2",
              callbackStartedMsAgo: 5,
            },
          },
        },
      },
    ];
    for (let num = 1; num <= 4; num += 1) {
      await sleep(randBetweenInt(300, 1000));
      yield [
        {
          platformId: "redis",
          resourceId: "redis_cache",
          actionsId: "redis_cache_localizationResult",
          base: {
            id: `after_be_${num}_${i}_3`,
            actionId: "redis_cache_localizationResult",
            connectedDeviceId: "be2",
            createMsAgo: 7,
            type: ActionOperationType.Cache,
            data: {
              // eslint-disable-next-line @typescript-eslint/prefer-as-const
              __typename: "CacheOperation" as "CacheOperation",
              type: CacheOperationType.Get,
              key: `localization_${num}`,
              payload: {
                serial_num: num,
                recv_time: "10",
                red_peaks: [0, 1, 2],
                red_widths: [1, 2, 3],
                red_heights: [1, 2, 3],
                blue_peaks: [1, 2, 3],
                blue_widths: [1, 2, 3],
                blue_heights: [1, 2, 3],
                cp_peaks: [1, 2, 3],
                cp_widths: [1, 2, 3],
                cp_heights: [1, 2, 3],
                is_detect_controller: true,
                red_max: 7,
                blue_max: 7,
                cp_max: 7,
                i_max: 7,
                q_max: 7,
                is_detect_red: true,
                is_detect_blue: true,
                is_detect_cp: true,
                is_clock_alignment: true,
                iteration_num: 7,
                iteration_total_time: 7,
                processing_time: 7,
                recv_signal_time: 7,
                sync_delay: 7,
              },
            },
          },
        },
      ];
    }
    const sleep2 = randBetweenInt(200, 500);
    await sleep(sleep2);
    yield [
      {
        platformId: "redis",
        resourceId: "redis_task",
        actionsId: "redis_task_algo",
        base: {
          id: `after_iot_${i}_1`,
          actionId: "redis_task_algo",
          connectedDeviceId: "be1",
          createMsAgo: 5 + sleep1 + sleep2,
          type: ActionOperationType.Task,
          data: {
            // eslint-disable-next-line @typescript-eslint/prefer-as-const
            __typename: "TaskOperation" as "TaskOperation",
            type: TaskOperationType.Queue,
            payload: {
              resultKeys: [
                `localization_1`,
                `localization_2`,
                `localization_3`,
                `localization_4`,
              ],
            },
            queueTo: {
              connectedDeviceId: "be2",
              callbackStartedMsAgo: 5 + sleep2,
              callbackEndedMsAgo: 5,
              returns: {
                geo_location: {
                  lat: 32 + randBetween(-2, 2),
                  lng: 34 + randBetween(-2, 2),
                },
              },
            },
          },
        },
      },
    ];
    const sleep3 = randBetweenInt(300, 1000);
    await sleep(sleep3);
    yield [
      {
        platformId: "redis",
        resourceId: "redis_task",
        actionsId: "redis_task_algo",
        base: {
          id: `after_iot_${i}_1`,
          actionId: "redis_task_algo",
          connectedDeviceId: "be1",
          createMsAgo: 5 + sleep1 + sleep2 + sleep3,
          type: ActionOperationType.Task,
          data: {
            // eslint-disable-next-line @typescript-eslint/prefer-as-const
            __typename: "TaskOperation" as "TaskOperation",
            type: TaskOperationType.Queue,
            payload: {
              resultKeys: [
                `localization_1`,
                `localization_2`,
                `localization_3`,
                `localization_4`,
              ],
            },
            queueTo: {
              connectedDeviceId: "be2",
              callbackStartedMsAgo: 5 + sleep2 + sleep3,
              callbackEndedMsAgo: 5 + sleep3,
              returns: {
                geo_location: {
                  lat: 32 + randBetween(-2, 2),
                  lng: 34 + randBetween(-2, 2),
                },
              },
              returnCallbackStartedMsAgo: 5,
            },
          },
        },
      },
    ];
    const sleep4 = randBetweenInt(300, 1000);
    await sleep(sleep4);
    yield [
      {
        platformId: "redis",
        resourceId: "redis_task",
        actionsId: "redis_task_algo",
        base: {
          actionId: "redis_task_algo",
          id: `after_iot_${i}_1`,
          connectedDeviceId: "be1",
          createMsAgo: 5 + sleep1 + sleep2 + sleep3 + sleep4,
          type: ActionOperationType.Task,
          data: {
            // eslint-disable-next-line @typescript-eslint/prefer-as-const
            __typename: "TaskOperation" as "TaskOperation",
            type: TaskOperationType.Queue,
            payload: {
              resultKeys: [
                `localization_1`,
                `localization_2`,
                `localization_3`,
                `localization_4`,
              ],
            },
            queueTo: {
              connectedDeviceId: "be2",
              callbackStartedMsAgo: 5 + sleep2 + sleep3 + sleep4,
              callbackEndedMsAgo: 5 + sleep3 + sleep4,
              returns: {
                geo_location: {
                  lat: 32 + randBetween(-2, 2),
                  lng: 34 + randBetween(-2, 2),
                },
              },
              returnCallbackStartedMsAgo: 5 + sleep4,
              returnCallbackEndedMsAgo: 5,
            },
          },
        },
      },
    ];

    await sleep(randBetweenInt(2000, 3000));
  }
  return undefined;
}

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
