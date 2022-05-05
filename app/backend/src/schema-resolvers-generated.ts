/* eslint-disable */
import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from "graphql";
import { Context } from "./context";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = {
  [X in Exclude<keyof T, K>]?: T[X];
} & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  SchemaValue: any;
  Json: any;
};

export type Query = {
  __typename?: "Query";
  test: Scalars["Boolean"];
  schema: Schema;
  platform: SchemaPlatform;
  resrouce: SchemaResource;
  action: SchemaAction;
};

export type QueryPlatformArgs = {
  id: Scalars["ID"];
};

export type QueryResrouceArgs = {
  id: Scalars["ID"];
};

export type QueryActionArgs = {
  id: Scalars["ID"];
};

export type Mutation = {
  __typename?: "Mutation";
  echo: Scalars["Boolean"];
};

export type MutationEchoArgs = {
  message: Scalars["String"];
};

export type Subscription = {
  __typename?: "Subscription";
  listenToEchoes: Scalars["String"];
  schema: Schema;
  platform: SchemaPlatform;
  resrouce: SchemaResource;
  action: SchemaAction;
};

export type SubscriptionPlatformArgs = {
  id: Scalars["ID"];
};

export type SubscriptionResrouceArgs = {
  id: Scalars["ID"];
};

export type SubscriptionActionArgs = {
  id: Scalars["ID"];
};

export enum Language {
  Typescript = "TYPESCRIPT",
  Python = "PYTHON",
}

export type ConnectedDevice = {
  id: Scalars["ID"];
  language: Language;
  secondsConnected: Scalars["Int"];
};

export type Schema = {
  __typename?: "Schema";
  platforms: Array<SchemaPlatform>;
  connectedDevices: Array<SchemaConnectedDevice>;
};

export enum SchemaPlatformType {
  Redis = "redis",
  P2p = "p2p",
}

export type SchemaPlatform = {
  __typename?: "SchemaPlatform";
  id: Scalars["ID"];
  type: SchemaPlatformType;
  models: Array<SchemaModel>;
  resources: Array<SchemaResource>;
  connectedDevices: Array<PlatformConnectedDevice>;
};

export type SchemaModel = {
  __typename?: "SchemaModel";
  id: Scalars["ID"];
  name: Scalars["String"];
  value: Scalars["SchemaValue"];
};

export enum SchemaResourceType {
  Cache = "cache",
  Pubsub = "pubsub",
  Task = "task",
}

export type SchemaResource = {
  __typename?: "SchemaResource";
  id: Scalars["ID"];
  type: SchemaResourceType;
  actions: Array<SchemaAction>;
  connectedDevices: Array<ResourceConnectedDevice>;
};

export type SchemaAction = {
  __typename?: "SchemaAction";
  id: Scalars["ID"];
  name: Scalars["String"];
  resource: SchemaResource;
  data: SchemaActionData;
};

export type SchemaActionData = SchemaCache | SchemaPubsub | SchemaTask;

export type SchemaActionBase = {
  key?: Maybe<Scalars["SchemaValue"]>;
  payload: Scalars["SchemaValue"];
};

export type SchemaCache = SchemaActionBase & {
  __typename?: "SchemaCache";
  key?: Maybe<Scalars["SchemaValue"]>;
  payload: Scalars["SchemaValue"];
  connectedDevices: Array<CacheConnectedDevice>;
};

export type SchemaPubsub = SchemaActionBase & {
  __typename?: "SchemaPubsub";
  key?: Maybe<Scalars["SchemaValue"]>;
  payload: Scalars["SchemaValue"];
  connectedDevices: Array<PubsubConnectedDevice>;
};

export type SchemaTask = SchemaActionBase & {
  __typename?: "SchemaTask";
  key?: Maybe<Scalars["SchemaValue"]>;
  payload: Scalars["SchemaValue"];
  returns?: Maybe<Scalars["SchemaValue"]>;
  connectedDevices: Array<TaskConnectedDevice>;
};

export type SchemaConnectedDevice = ConnectedDevice & {
  __typename?: "SchemaConnectedDevice";
  id: Scalars["ID"];
  language: Language;
  secondsConnected: Scalars["Int"];
  graph: Array<SchemaGraphPlatform>;
};

export type SchemaGraphPlatform = {
  __typename?: "SchemaGraphPlatform";
  platformId: Scalars["ID"];
  resources: Array<PlatformGraphResource>;
};

export type PlatformConnectedDevice = ConnectedDevice & {
  __typename?: "PlatformConnectedDevice";
  id: Scalars["ID"];
  language: Language;
  secondsConnected: Scalars["Int"];
  graph: Array<PlatformGraphResource>;
};

export type PlatformGraphResource = {
  __typename?: "PlatformGraphResource";
  resourceId: Scalars["ID"];
  actions: Array<ResourceGraphAction>;
};

export type ResourceConnectedDevice = ConnectedDevice & {
  __typename?: "ResourceConnectedDevice";
  id: Scalars["ID"];
  language: Language;
  secondsConnected: Scalars["Int"];
  graph: Array<ResourceGraphAction>;
};

export type ActionOperation = CacheOperation | PubsubOperation | TaskOperation;

export type ResourceGraphAction = {
  __typename?: "ResourceGraphAction";
  actionId: Scalars["ID"];
  operations: Array<ActionOperation>;
};

export type CacheConnectedDevice = ConnectedDevice & {
  __typename?: "CacheConnectedDevice";
  id: Scalars["ID"];
  language: Language;
  secondsConnected: Scalars["Int"];
  operations: Array<CacheOperation>;
};

export type PubsubConnectedDevice = ConnectedDevice & {
  __typename?: "PubsubConnectedDevice";
  id: Scalars["ID"];
  language: Language;
  secondsConnected: Scalars["Int"];
  operations: Array<PubsubOperation>;
};

export type TaskConnectedDevice = ConnectedDevice & {
  __typename?: "TaskConnectedDevice";
  id: Scalars["ID"];
  language: Language;
  secondsConnected: Scalars["Int"];
  operations: Array<TaskOperation>;
};

export enum CacheOperationType {
  Get = "get",
  Set = "set",
}

export type CacheOperation = {
  __typename?: "CacheOperation";
  type: CacheOperationType;
  timeInMs: Scalars["Int"];
  createTimeMsAgo: Scalars["Int"];
  key?: Maybe<Scalars["Json"]>;
  payload: Scalars["Json"];
};

export enum PubsubOperationType {
  Publish = "publish",
  Subscribe = "subscribe",
  SubscribeCallback = "subscribeCallback",
}

export type PubsubOperation = {
  __typename?: "PubsubOperation";
  type: PubsubOperationType;
  timeInMs: Scalars["Int"];
  createTimeMsAgo: Scalars["Int"];
  timeCallbackTook?: Maybe<Scalars["Int"]>;
};

export enum TaskOperationType {
  Queue = "queue",
  Dequeue = "dequeue",
  DequeueCallback = "dequeueCallback",
  QueueCallback = "queueCallback",
}

export type TaskOperation = {
  __typename?: "TaskOperation";
  type: TaskOperationType;
  timeInMs: Scalars["Int"];
  createTimeMsAgo: Scalars["Int"];
  timeCallbackTook?: Maybe<Scalars["Int"]>;
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> =
  | LegacyStitchingResolver<TResult, TParent, TContext, TArgs>
  | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {}
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {}
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  SchemaValue: ResolverTypeWrapper<Scalars["SchemaValue"]>;
  Json: ResolverTypeWrapper<Scalars["Json"]>;
  Query: ResolverTypeWrapper<{}>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]>;
  ID: ResolverTypeWrapper<Scalars["ID"]>;
  Mutation: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars["String"]>;
  Subscription: ResolverTypeWrapper<{}>;
  Language: Language;
  ConnectedDevice:
    | ResolversTypes["SchemaConnectedDevice"]
    | ResolversTypes["PlatformConnectedDevice"]
    | ResolversTypes["ResourceConnectedDevice"]
    | ResolversTypes["CacheConnectedDevice"]
    | ResolversTypes["PubsubConnectedDevice"]
    | ResolversTypes["TaskConnectedDevice"];
  Int: ResolverTypeWrapper<Scalars["Int"]>;
  Schema: ResolverTypeWrapper<Schema>;
  SchemaPlatformType: SchemaPlatformType;
  SchemaPlatform: ResolverTypeWrapper<SchemaPlatform>;
  SchemaModel: ResolverTypeWrapper<SchemaModel>;
  SchemaResourceType: SchemaResourceType;
  SchemaResource: ResolverTypeWrapper<SchemaResource>;
  SchemaAction: ResolverTypeWrapper<
    Omit<SchemaAction, "data"> & { data: ResolversTypes["SchemaActionData"] }
  >;
  SchemaActionData:
    | ResolversTypes["SchemaCache"]
    | ResolversTypes["SchemaPubsub"]
    | ResolversTypes["SchemaTask"];
  SchemaActionBase:
    | ResolversTypes["SchemaCache"]
    | ResolversTypes["SchemaPubsub"]
    | ResolversTypes["SchemaTask"];
  SchemaCache: ResolverTypeWrapper<SchemaCache>;
  SchemaPubsub: ResolverTypeWrapper<SchemaPubsub>;
  SchemaTask: ResolverTypeWrapper<SchemaTask>;
  SchemaConnectedDevice: ResolverTypeWrapper<SchemaConnectedDevice>;
  SchemaGraphPlatform: ResolverTypeWrapper<SchemaGraphPlatform>;
  PlatformConnectedDevice: ResolverTypeWrapper<PlatformConnectedDevice>;
  PlatformGraphResource: ResolverTypeWrapper<PlatformGraphResource>;
  ResourceConnectedDevice: ResolverTypeWrapper<ResourceConnectedDevice>;
  ActionOperation:
    | ResolversTypes["CacheOperation"]
    | ResolversTypes["PubsubOperation"]
    | ResolversTypes["TaskOperation"];
  ResourceGraphAction: ResolverTypeWrapper<
    Omit<ResourceGraphAction, "operations"> & {
      operations: Array<ResolversTypes["ActionOperation"]>;
    }
  >;
  CacheConnectedDevice: ResolverTypeWrapper<CacheConnectedDevice>;
  PubsubConnectedDevice: ResolverTypeWrapper<PubsubConnectedDevice>;
  TaskConnectedDevice: ResolverTypeWrapper<TaskConnectedDevice>;
  CacheOperationType: CacheOperationType;
  CacheOperation: ResolverTypeWrapper<CacheOperation>;
  PubsubOperationType: PubsubOperationType;
  PubsubOperation: ResolverTypeWrapper<PubsubOperation>;
  TaskOperationType: TaskOperationType;
  TaskOperation: ResolverTypeWrapper<TaskOperation>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  SchemaValue: Scalars["SchemaValue"];
  Json: Scalars["Json"];
  Query: {};
  Boolean: Scalars["Boolean"];
  ID: Scalars["ID"];
  Mutation: {};
  String: Scalars["String"];
  Subscription: {};
  ConnectedDevice:
    | ResolversParentTypes["SchemaConnectedDevice"]
    | ResolversParentTypes["PlatformConnectedDevice"]
    | ResolversParentTypes["ResourceConnectedDevice"]
    | ResolversParentTypes["CacheConnectedDevice"]
    | ResolversParentTypes["PubsubConnectedDevice"]
    | ResolversParentTypes["TaskConnectedDevice"];
  Int: Scalars["Int"];
  Schema: Schema;
  SchemaPlatform: SchemaPlatform;
  SchemaModel: SchemaModel;
  SchemaResource: SchemaResource;
  SchemaAction: Omit<SchemaAction, "data"> & {
    data: ResolversParentTypes["SchemaActionData"];
  };
  SchemaActionData:
    | ResolversParentTypes["SchemaCache"]
    | ResolversParentTypes["SchemaPubsub"]
    | ResolversParentTypes["SchemaTask"];
  SchemaActionBase:
    | ResolversParentTypes["SchemaCache"]
    | ResolversParentTypes["SchemaPubsub"]
    | ResolversParentTypes["SchemaTask"];
  SchemaCache: SchemaCache;
  SchemaPubsub: SchemaPubsub;
  SchemaTask: SchemaTask;
  SchemaConnectedDevice: SchemaConnectedDevice;
  SchemaGraphPlatform: SchemaGraphPlatform;
  PlatformConnectedDevice: PlatformConnectedDevice;
  PlatformGraphResource: PlatformGraphResource;
  ResourceConnectedDevice: ResourceConnectedDevice;
  ActionOperation:
    | ResolversParentTypes["CacheOperation"]
    | ResolversParentTypes["PubsubOperation"]
    | ResolversParentTypes["TaskOperation"];
  ResourceGraphAction: Omit<ResourceGraphAction, "operations"> & {
    operations: Array<ResolversParentTypes["ActionOperation"]>;
  };
  CacheConnectedDevice: CacheConnectedDevice;
  PubsubConnectedDevice: PubsubConnectedDevice;
  TaskConnectedDevice: TaskConnectedDevice;
  CacheOperation: CacheOperation;
  PubsubOperation: PubsubOperation;
  TaskOperation: TaskOperation;
};

export interface SchemaValueScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["SchemaValue"], any> {
  name: "SchemaValue";
}

export interface JsonScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["Json"], any> {
  name: "Json";
}

export type QueryResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]
> = {
  test?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  schema?: Resolver<ResolversTypes["Schema"], ParentType, ContextType>;
  platform?: Resolver<
    ResolversTypes["SchemaPlatform"],
    ParentType,
    ContextType,
    RequireFields<QueryPlatformArgs, "id">
  >;
  resrouce?: Resolver<
    ResolversTypes["SchemaResource"],
    ParentType,
    ContextType,
    RequireFields<QueryResrouceArgs, "id">
  >;
  action?: Resolver<
    ResolversTypes["SchemaAction"],
    ParentType,
    ContextType,
    RequireFields<QueryActionArgs, "id">
  >;
};

export type MutationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"]
> = {
  echo?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    RequireFields<MutationEchoArgs, "message">
  >;
};

export type SubscriptionResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Subscription"] = ResolversParentTypes["Subscription"]
> = {
  listenToEchoes?: SubscriptionResolver<
    ResolversTypes["String"],
    "listenToEchoes",
    ParentType,
    ContextType
  >;
  schema?: SubscriptionResolver<
    ResolversTypes["Schema"],
    "schema",
    ParentType,
    ContextType
  >;
  platform?: SubscriptionResolver<
    ResolversTypes["SchemaPlatform"],
    "platform",
    ParentType,
    ContextType,
    RequireFields<SubscriptionPlatformArgs, "id">
  >;
  resrouce?: SubscriptionResolver<
    ResolversTypes["SchemaResource"],
    "resrouce",
    ParentType,
    ContextType,
    RequireFields<SubscriptionResrouceArgs, "id">
  >;
  action?: SubscriptionResolver<
    ResolversTypes["SchemaAction"],
    "action",
    ParentType,
    ContextType,
    RequireFields<SubscriptionActionArgs, "id">
  >;
};

export type ConnectedDeviceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["ConnectedDevice"] = ResolversParentTypes["ConnectedDevice"]
> = {
  __resolveType: TypeResolveFn<
    | "SchemaConnectedDevice"
    | "PlatformConnectedDevice"
    | "ResourceConnectedDevice"
    | "CacheConnectedDevice"
    | "PubsubConnectedDevice"
    | "TaskConnectedDevice",
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  language?: Resolver<ResolversTypes["Language"], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
};

export type SchemaResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Schema"] = ResolversParentTypes["Schema"]
> = {
  platforms?: Resolver<
    Array<ResolversTypes["SchemaPlatform"]>,
    ParentType,
    ContextType
  >;
  connectedDevices?: Resolver<
    Array<ResolversTypes["SchemaConnectedDevice"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaPlatformResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaPlatform"] = ResolversParentTypes["SchemaPlatform"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  type?: Resolver<
    ResolversTypes["SchemaPlatformType"],
    ParentType,
    ContextType
  >;
  models?: Resolver<
    Array<ResolversTypes["SchemaModel"]>,
    ParentType,
    ContextType
  >;
  resources?: Resolver<
    Array<ResolversTypes["SchemaResource"]>,
    ParentType,
    ContextType
  >;
  connectedDevices?: Resolver<
    Array<ResolversTypes["PlatformConnectedDevice"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaModelResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaModel"] = ResolversParentTypes["SchemaModel"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  value?: Resolver<ResolversTypes["SchemaValue"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaResourceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaResource"] = ResolversParentTypes["SchemaResource"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  type?: Resolver<
    ResolversTypes["SchemaResourceType"],
    ParentType,
    ContextType
  >;
  actions?: Resolver<
    Array<ResolversTypes["SchemaAction"]>,
    ParentType,
    ContextType
  >;
  connectedDevices?: Resolver<
    Array<ResolversTypes["ResourceConnectedDevice"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaActionResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaAction"] = ResolversParentTypes["SchemaAction"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  resource?: Resolver<
    ResolversTypes["SchemaResource"],
    ParentType,
    ContextType
  >;
  data?: Resolver<ResolversTypes["SchemaActionData"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaActionDataResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaActionData"] = ResolversParentTypes["SchemaActionData"]
> = {
  __resolveType: TypeResolveFn<
    "SchemaCache" | "SchemaPubsub" | "SchemaTask",
    ParentType,
    ContextType
  >;
};

export type SchemaActionBaseResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaActionBase"] = ResolversParentTypes["SchemaActionBase"]
> = {
  __resolveType: TypeResolveFn<
    "SchemaCache" | "SchemaPubsub" | "SchemaTask",
    ParentType,
    ContextType
  >;
  key?: Resolver<Maybe<ResolversTypes["SchemaValue"]>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes["SchemaValue"], ParentType, ContextType>;
};

export type SchemaCacheResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaCache"] = ResolversParentTypes["SchemaCache"]
> = {
  key?: Resolver<Maybe<ResolversTypes["SchemaValue"]>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes["SchemaValue"], ParentType, ContextType>;
  connectedDevices?: Resolver<
    Array<ResolversTypes["CacheConnectedDevice"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaPubsubResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaPubsub"] = ResolversParentTypes["SchemaPubsub"]
> = {
  key?: Resolver<Maybe<ResolversTypes["SchemaValue"]>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes["SchemaValue"], ParentType, ContextType>;
  connectedDevices?: Resolver<
    Array<ResolversTypes["PubsubConnectedDevice"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaTaskResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaTask"] = ResolversParentTypes["SchemaTask"]
> = {
  key?: Resolver<Maybe<ResolversTypes["SchemaValue"]>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes["SchemaValue"], ParentType, ContextType>;
  returns?: Resolver<
    Maybe<ResolversTypes["SchemaValue"]>,
    ParentType,
    ContextType
  >;
  connectedDevices?: Resolver<
    Array<ResolversTypes["TaskConnectedDevice"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaConnectedDeviceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaConnectedDevice"] = ResolversParentTypes["SchemaConnectedDevice"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  language?: Resolver<ResolversTypes["Language"], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  graph?: Resolver<
    Array<ResolversTypes["SchemaGraphPlatform"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaGraphPlatformResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaGraphPlatform"] = ResolversParentTypes["SchemaGraphPlatform"]
> = {
  platformId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  resources?: Resolver<
    Array<ResolversTypes["PlatformGraphResource"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlatformConnectedDeviceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["PlatformConnectedDevice"] = ResolversParentTypes["PlatformConnectedDevice"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  language?: Resolver<ResolversTypes["Language"], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  graph?: Resolver<
    Array<ResolversTypes["PlatformGraphResource"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlatformGraphResourceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["PlatformGraphResource"] = ResolversParentTypes["PlatformGraphResource"]
> = {
  resourceId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  actions?: Resolver<
    Array<ResolversTypes["ResourceGraphAction"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ResourceConnectedDeviceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["ResourceConnectedDevice"] = ResolversParentTypes["ResourceConnectedDevice"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  language?: Resolver<ResolversTypes["Language"], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  graph?: Resolver<
    Array<ResolversTypes["ResourceGraphAction"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ActionOperationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["ActionOperation"] = ResolversParentTypes["ActionOperation"]
> = {
  __resolveType: TypeResolveFn<
    "CacheOperation" | "PubsubOperation" | "TaskOperation",
    ParentType,
    ContextType
  >;
};

export type ResourceGraphActionResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["ResourceGraphAction"] = ResolversParentTypes["ResourceGraphAction"]
> = {
  actionId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  operations?: Resolver<
    Array<ResolversTypes["ActionOperation"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CacheConnectedDeviceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["CacheConnectedDevice"] = ResolversParentTypes["CacheConnectedDevice"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  language?: Resolver<ResolversTypes["Language"], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  operations?: Resolver<
    Array<ResolversTypes["CacheOperation"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PubsubConnectedDeviceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["PubsubConnectedDevice"] = ResolversParentTypes["PubsubConnectedDevice"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  language?: Resolver<ResolversTypes["Language"], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  operations?: Resolver<
    Array<ResolversTypes["PubsubOperation"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TaskConnectedDeviceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["TaskConnectedDevice"] = ResolversParentTypes["TaskConnectedDevice"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  language?: Resolver<ResolversTypes["Language"], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  operations?: Resolver<
    Array<ResolversTypes["TaskOperation"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CacheOperationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["CacheOperation"] = ResolversParentTypes["CacheOperation"]
> = {
  type?: Resolver<
    ResolversTypes["CacheOperationType"],
    ParentType,
    ContextType
  >;
  timeInMs?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  createTimeMsAgo?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes["Json"]>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes["Json"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PubsubOperationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["PubsubOperation"] = ResolversParentTypes["PubsubOperation"]
> = {
  type?: Resolver<
    ResolversTypes["PubsubOperationType"],
    ParentType,
    ContextType
  >;
  timeInMs?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  createTimeMsAgo?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  timeCallbackTook?: Resolver<
    Maybe<ResolversTypes["Int"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TaskOperationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["TaskOperation"] = ResolversParentTypes["TaskOperation"]
> = {
  type?: Resolver<ResolversTypes["TaskOperationType"], ParentType, ContextType>;
  timeInMs?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  createTimeMsAgo?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  timeCallbackTook?: Resolver<
    Maybe<ResolversTypes["Int"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  SchemaValue?: GraphQLScalarType;
  Json?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  ConnectedDevice?: ConnectedDeviceResolvers<ContextType>;
  Schema?: SchemaResolvers<ContextType>;
  SchemaPlatform?: SchemaPlatformResolvers<ContextType>;
  SchemaModel?: SchemaModelResolvers<ContextType>;
  SchemaResource?: SchemaResourceResolvers<ContextType>;
  SchemaAction?: SchemaActionResolvers<ContextType>;
  SchemaActionData?: SchemaActionDataResolvers<ContextType>;
  SchemaActionBase?: SchemaActionBaseResolvers<ContextType>;
  SchemaCache?: SchemaCacheResolvers<ContextType>;
  SchemaPubsub?: SchemaPubsubResolvers<ContextType>;
  SchemaTask?: SchemaTaskResolvers<ContextType>;
  SchemaConnectedDevice?: SchemaConnectedDeviceResolvers<ContextType>;
  SchemaGraphPlatform?: SchemaGraphPlatformResolvers<ContextType>;
  PlatformConnectedDevice?: PlatformConnectedDeviceResolvers<ContextType>;
  PlatformGraphResource?: PlatformGraphResourceResolvers<ContextType>;
  ResourceConnectedDevice?: ResourceConnectedDeviceResolvers<ContextType>;
  ActionOperation?: ActionOperationResolvers<ContextType>;
  ResourceGraphAction?: ResourceGraphActionResolvers<ContextType>;
  CacheConnectedDevice?: CacheConnectedDeviceResolvers<ContextType>;
  PubsubConnectedDevice?: PubsubConnectedDeviceResolvers<ContextType>;
  TaskConnectedDevice?: TaskConnectedDeviceResolvers<ContextType>;
  CacheOperation?: CacheOperationResolvers<ContextType>;
  PubsubOperation?: PubsubOperationResolvers<ContextType>;
  TaskOperation?: TaskOperationResolvers<ContextType>;
};

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
