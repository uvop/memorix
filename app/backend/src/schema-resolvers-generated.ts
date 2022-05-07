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
  resource: SchemaResource;
  action: SchemaAction;
};

export type QueryPlatformArgs = {
  id: Scalars["ID"];
};

export type QueryResourceArgs = {
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
  schemaOperations: Array<SchemaOperation>;
  schemaLastOperations: Array<SchemaOperation>;
  platformOperations: Array<PlatformOperation>;
  platformLastOperations: Array<PlatformOperation>;
  resourceOperations: Array<ResourceOperation>;
  resourceLastOperations: Array<ResourceOperation>;
  actionOperations: Array<ActionOperation>;
  actionLastOperations: Array<ActionOperation>;
};

export type SubscriptionPlatformOperationsArgs = {
  id: Scalars["ID"];
};

export type SubscriptionPlatformLastOperationsArgs = {
  id: Scalars["ID"];
};

export type SubscriptionResourceOperationsArgs = {
  id: Scalars["ID"];
};

export type SubscriptionResourceLastOperationsArgs = {
  id: Scalars["ID"];
};

export type SubscriptionActionOperationsArgs = {
  id: Scalars["ID"];
};

export type SubscriptionActionLastOperationsArgs = {
  id: Scalars["ID"];
};

export enum Language {
  Typescript = "TYPESCRIPT",
  Python = "PYTHON",
}

export type ConnectedDevice = {
  __typename?: "ConnectedDevice";
  id: Scalars["ID"];
  name: Scalars["String"];
  language: Language;
  secondsConnected: Scalars["Int"];
};

export type Schema = {
  __typename?: "Schema";
  platforms: Array<SchemaPlatform>;
  connectedDevices: Array<ConnectedDevice>;
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
  connectedDevices: Array<ConnectedDevice>;
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
  connectedDevices: Array<ConnectedDevice>;
};

export type SchemaAction = {
  __typename?: "SchemaAction";
  id: Scalars["ID"];
  name: Scalars["String"];
  key?: Maybe<Scalars["SchemaValue"]>;
  payload: Scalars["SchemaValue"];
  returns?: Maybe<Scalars["SchemaValue"]>;
  connectedDevices: Array<ConnectedDevice>;
};

export type SchemaOperation = {
  __typename?: "SchemaOperation";
  platformId: Scalars["ID"];
  operation: ActionOperation;
};

export type PlatformOperation = {
  __typename?: "PlatformOperation";
  resourceId: Scalars["ID"];
  operation: ActionOperation;
};

export type ResourceOperation = {
  __typename?: "ResourceOperation";
  actionId: Scalars["ID"];
  operation: ActionOperation;
};

export enum ActionOperationType {
  Cache = "cache",
  Pubsub = "pubsub",
  Task = "task",
}

export type ActionOperation = {
  __typename?: "ActionOperation";
  id: Scalars["ID"];
  actionId: Scalars["ID"];
  connectedDeviceId: Scalars["ID"];
  createMsAgo: Scalars["Int"];
  type: ActionOperationType;
  data: ActionOperationData;
};

export type ActionOperationData =
  | CacheOperation
  | PubsubOperation
  | TaskOperation;

export enum CacheOperationType {
  Get = "get",
  Set = "set",
}

export type CacheOperation = {
  __typename?: "CacheOperation";
  type: CacheOperationType;
  key?: Maybe<Scalars["Json"]>;
  payload: Scalars["Json"];
};

export enum PubsubOperationType {
  Publish = "publish",
  Subscribe = "subscribe",
}

export type PubsubOperation = {
  __typename?: "PubsubOperation";
  type: PubsubOperationType;
  key?: Maybe<Scalars["Json"]>;
  payload?: Maybe<Scalars["Json"]>;
  publishTo?: Maybe<Array<PubsubOperationPublishTo>>;
};

export type PubsubOperationPublishTo = {
  __typename?: "PubsubOperationPublishTo";
  connectedDeviceId: Scalars["ID"];
  callbackStartedMsAgo: Scalars["Int"];
  callbackEndedMsAgo?: Maybe<Scalars["Int"]>;
};

export enum TaskOperationType {
  Queue = "queue",
  Dequeue = "dequeue",
}

export type TaskOperation = {
  __typename?: "TaskOperation";
  type: TaskOperationType;
  key?: Maybe<Scalars["Json"]>;
  payload?: Maybe<Scalars["Json"]>;
  queueTo?: Maybe<TaskOperationQueueTo>;
};

export type TaskOperationQueueTo = {
  __typename?: "TaskOperationQueueTo";
  connectedDeviceId: Scalars["ID"];
  callbackStartedMsAgo: Scalars["Int"];
  callbackEndedMsAgo?: Maybe<Scalars["Int"]>;
  returns?: Maybe<Scalars["Json"]>;
  returnCallbackStartedMsAgo?: Maybe<Scalars["Int"]>;
  returnCallbackEndedMsAgo?: Maybe<Scalars["Int"]>;
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
  ConnectedDevice: ResolverTypeWrapper<ConnectedDevice>;
  Int: ResolverTypeWrapper<Scalars["Int"]>;
  Schema: ResolverTypeWrapper<Schema>;
  SchemaPlatformType: SchemaPlatformType;
  SchemaPlatform: ResolverTypeWrapper<SchemaPlatform>;
  SchemaModel: ResolverTypeWrapper<SchemaModel>;
  SchemaResourceType: SchemaResourceType;
  SchemaResource: ResolverTypeWrapper<SchemaResource>;
  SchemaAction: ResolverTypeWrapper<SchemaAction>;
  SchemaOperation: ResolverTypeWrapper<SchemaOperation>;
  PlatformOperation: ResolverTypeWrapper<PlatformOperation>;
  ResourceOperation: ResolverTypeWrapper<ResourceOperation>;
  ActionOperationType: ActionOperationType;
  ActionOperation: ResolverTypeWrapper<
    Omit<ActionOperation, "data"> & {
      data: ResolversTypes["ActionOperationData"];
    }
  >;
  ActionOperationData:
    | ResolversTypes["CacheOperation"]
    | ResolversTypes["PubsubOperation"]
    | ResolversTypes["TaskOperation"];
  CacheOperationType: CacheOperationType;
  CacheOperation: ResolverTypeWrapper<CacheOperation>;
  PubsubOperationType: PubsubOperationType;
  PubsubOperation: ResolverTypeWrapper<PubsubOperation>;
  PubsubOperationPublishTo: ResolverTypeWrapper<PubsubOperationPublishTo>;
  TaskOperationType: TaskOperationType;
  TaskOperation: ResolverTypeWrapper<TaskOperation>;
  TaskOperationQueueTo: ResolverTypeWrapper<TaskOperationQueueTo>;
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
  ConnectedDevice: ConnectedDevice;
  Int: Scalars["Int"];
  Schema: Schema;
  SchemaPlatform: SchemaPlatform;
  SchemaModel: SchemaModel;
  SchemaResource: SchemaResource;
  SchemaAction: SchemaAction;
  SchemaOperation: SchemaOperation;
  PlatformOperation: PlatformOperation;
  ResourceOperation: ResourceOperation;
  ActionOperation: Omit<ActionOperation, "data"> & {
    data: ResolversParentTypes["ActionOperationData"];
  };
  ActionOperationData:
    | ResolversParentTypes["CacheOperation"]
    | ResolversParentTypes["PubsubOperation"]
    | ResolversParentTypes["TaskOperation"];
  CacheOperation: CacheOperation;
  PubsubOperation: PubsubOperation;
  PubsubOperationPublishTo: PubsubOperationPublishTo;
  TaskOperation: TaskOperation;
  TaskOperationQueueTo: TaskOperationQueueTo;
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
  resource?: Resolver<
    ResolversTypes["SchemaResource"],
    ParentType,
    ContextType,
    RequireFields<QueryResourceArgs, "id">
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
  schemaOperations?: SubscriptionResolver<
    Array<ResolversTypes["SchemaOperation"]>,
    "schemaOperations",
    ParentType,
    ContextType
  >;
  schemaLastOperations?: SubscriptionResolver<
    Array<ResolversTypes["SchemaOperation"]>,
    "schemaLastOperations",
    ParentType,
    ContextType
  >;
  platformOperations?: SubscriptionResolver<
    Array<ResolversTypes["PlatformOperation"]>,
    "platformOperations",
    ParentType,
    ContextType,
    RequireFields<SubscriptionPlatformOperationsArgs, "id">
  >;
  platformLastOperations?: SubscriptionResolver<
    Array<ResolversTypes["PlatformOperation"]>,
    "platformLastOperations",
    ParentType,
    ContextType,
    RequireFields<SubscriptionPlatformLastOperationsArgs, "id">
  >;
  resourceOperations?: SubscriptionResolver<
    Array<ResolversTypes["ResourceOperation"]>,
    "resourceOperations",
    ParentType,
    ContextType,
    RequireFields<SubscriptionResourceOperationsArgs, "id">
  >;
  resourceLastOperations?: SubscriptionResolver<
    Array<ResolversTypes["ResourceOperation"]>,
    "resourceLastOperations",
    ParentType,
    ContextType,
    RequireFields<SubscriptionResourceLastOperationsArgs, "id">
  >;
  actionOperations?: SubscriptionResolver<
    Array<ResolversTypes["ActionOperation"]>,
    "actionOperations",
    ParentType,
    ContextType,
    RequireFields<SubscriptionActionOperationsArgs, "id">
  >;
  actionLastOperations?: SubscriptionResolver<
    Array<ResolversTypes["ActionOperation"]>,
    "actionLastOperations",
    ParentType,
    ContextType,
    RequireFields<SubscriptionActionLastOperationsArgs, "id">
  >;
};

export type ConnectedDeviceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["ConnectedDevice"] = ResolversParentTypes["ConnectedDevice"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  language?: Resolver<ResolversTypes["Language"], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
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
    Array<ResolversTypes["ConnectedDevice"]>,
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
    Array<ResolversTypes["ConnectedDevice"]>,
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
    Array<ResolversTypes["ConnectedDevice"]>,
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
  key?: Resolver<Maybe<ResolversTypes["SchemaValue"]>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes["SchemaValue"], ParentType, ContextType>;
  returns?: Resolver<
    Maybe<ResolversTypes["SchemaValue"]>,
    ParentType,
    ContextType
  >;
  connectedDevices?: Resolver<
    Array<ResolversTypes["ConnectedDevice"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaOperationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaOperation"] = ResolversParentTypes["SchemaOperation"]
> = {
  platformId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  operation?: Resolver<
    ResolversTypes["ActionOperation"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlatformOperationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["PlatformOperation"] = ResolversParentTypes["PlatformOperation"]
> = {
  resourceId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  operation?: Resolver<
    ResolversTypes["ActionOperation"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ResourceOperationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["ResourceOperation"] = ResolversParentTypes["ResourceOperation"]
> = {
  actionId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  operation?: Resolver<
    ResolversTypes["ActionOperation"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ActionOperationResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["ActionOperation"] = ResolversParentTypes["ActionOperation"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  actionId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  connectedDeviceId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  createMsAgo?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  type?: Resolver<
    ResolversTypes["ActionOperationType"],
    ParentType,
    ContextType
  >;
  data?: Resolver<
    ResolversTypes["ActionOperationData"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ActionOperationDataResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["ActionOperationData"] = ResolversParentTypes["ActionOperationData"]
> = {
  __resolveType: TypeResolveFn<
    "CacheOperation" | "PubsubOperation" | "TaskOperation",
    ParentType,
    ContextType
  >;
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
  key?: Resolver<Maybe<ResolversTypes["Json"]>, ParentType, ContextType>;
  payload?: Resolver<Maybe<ResolversTypes["Json"]>, ParentType, ContextType>;
  publishTo?: Resolver<
    Maybe<Array<ResolversTypes["PubsubOperationPublishTo"]>>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PubsubOperationPublishToResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["PubsubOperationPublishTo"] = ResolversParentTypes["PubsubOperationPublishTo"]
> = {
  connectedDeviceId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  callbackStartedMsAgo?: Resolver<
    ResolversTypes["Int"],
    ParentType,
    ContextType
  >;
  callbackEndedMsAgo?: Resolver<
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
  key?: Resolver<Maybe<ResolversTypes["Json"]>, ParentType, ContextType>;
  payload?: Resolver<Maybe<ResolversTypes["Json"]>, ParentType, ContextType>;
  queueTo?: Resolver<
    Maybe<ResolversTypes["TaskOperationQueueTo"]>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TaskOperationQueueToResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["TaskOperationQueueTo"] = ResolversParentTypes["TaskOperationQueueTo"]
> = {
  connectedDeviceId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  callbackStartedMsAgo?: Resolver<
    ResolversTypes["Int"],
    ParentType,
    ContextType
  >;
  callbackEndedMsAgo?: Resolver<
    Maybe<ResolversTypes["Int"]>,
    ParentType,
    ContextType
  >;
  returns?: Resolver<Maybe<ResolversTypes["Json"]>, ParentType, ContextType>;
  returnCallbackStartedMsAgo?: Resolver<
    Maybe<ResolversTypes["Int"]>,
    ParentType,
    ContextType
  >;
  returnCallbackEndedMsAgo?: Resolver<
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
  SchemaOperation?: SchemaOperationResolvers<ContextType>;
  PlatformOperation?: PlatformOperationResolvers<ContextType>;
  ResourceOperation?: ResourceOperationResolvers<ContextType>;
  ActionOperation?: ActionOperationResolvers<ContextType>;
  ActionOperationData?: ActionOperationDataResolvers<ContextType>;
  CacheOperation?: CacheOperationResolvers<ContextType>;
  PubsubOperation?: PubsubOperationResolvers<ContextType>;
  PubsubOperationPublishTo?: PubsubOperationPublishToResolvers<ContextType>;
  TaskOperation?: TaskOperationResolvers<ContextType>;
  TaskOperationQueueTo?: TaskOperationQueueToResolvers<ContextType>;
};

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
