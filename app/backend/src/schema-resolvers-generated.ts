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
};

export type Query = {
  __typename?: "Query";
  test: Scalars["Boolean"];
  schema: Schema;
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
  connectedDevices: Array<ConnectedDevice>;
};

export enum Language {
  Typescript = "TYPESCRIPT",
}

export enum EventType {
  Get = "GET",
  Set = "SET",
}

export type ConnectedDevice = {
  __typename?: "ConnectedDevice";
  id: Scalars["ID"];
  language: Language;
  secondsConnected: Scalars["Int"];
};

export type Schema = {
  __typename?: "Schema";
  models: Array<SchemaModel>;
  cache: Array<SchemaCache>;
  pubsub: Array<SchemaPubsub>;
  task: Array<SchemaTask>;
};

export type SchemaModel = {
  __typename?: "SchemaModel";
  id: Scalars["ID"];
  name: Scalars["String"];
  value: Scalars["SchemaValue"];
};

export type SchemaCache = {
  __typename?: "SchemaCache";
  id: Scalars["ID"];
  name: Scalars["String"];
  key?: Maybe<Scalars["SchemaValue"]>;
  payload: Scalars["SchemaValue"];
};

export type SchemaPubsub = {
  __typename?: "SchemaPubsub";
  id: Scalars["ID"];
  name: Scalars["String"];
  key?: Maybe<Scalars["SchemaValue"]>;
  payload: Scalars["SchemaValue"];
};

export type SchemaTask = {
  __typename?: "SchemaTask";
  id: Scalars["ID"];
  name: Scalars["String"];
  key?: Maybe<Scalars["SchemaValue"]>;
  payload: Scalars["SchemaValue"];
  returns?: Maybe<Scalars["SchemaValue"]>;
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
  Query: ResolverTypeWrapper<{}>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]>;
  Mutation: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars["String"]>;
  Subscription: ResolverTypeWrapper<{}>;
  Language: Language;
  EventType: EventType;
  ConnectedDevice: ResolverTypeWrapper<ConnectedDevice>;
  ID: ResolverTypeWrapper<Scalars["ID"]>;
  Int: ResolverTypeWrapper<Scalars["Int"]>;
  Schema: ResolverTypeWrapper<Schema>;
  SchemaModel: ResolverTypeWrapper<SchemaModel>;
  SchemaCache: ResolverTypeWrapper<SchemaCache>;
  SchemaPubsub: ResolverTypeWrapper<SchemaPubsub>;
  SchemaTask: ResolverTypeWrapper<SchemaTask>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  SchemaValue: Scalars["SchemaValue"];
  Query: {};
  Boolean: Scalars["Boolean"];
  Mutation: {};
  String: Scalars["String"];
  Subscription: {};
  ConnectedDevice: ConnectedDevice;
  ID: Scalars["ID"];
  Int: Scalars["Int"];
  Schema: Schema;
  SchemaModel: SchemaModel;
  SchemaCache: SchemaCache;
  SchemaPubsub: SchemaPubsub;
  SchemaTask: SchemaTask;
};

export interface SchemaValueScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["SchemaValue"], any> {
  name: "SchemaValue";
}

export type QueryResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]
> = {
  test?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  schema?: Resolver<ResolversTypes["Schema"], ParentType, ContextType>;
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
  connectedDevices?: SubscriptionResolver<
    Array<ResolversTypes["ConnectedDevice"]>,
    "connectedDevices",
    ParentType,
    ContextType
  >;
};

export type ConnectedDeviceResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["ConnectedDevice"] = ResolversParentTypes["ConnectedDevice"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  language?: Resolver<ResolversTypes["Language"], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["Schema"] = ResolversParentTypes["Schema"]
> = {
  models?: Resolver<
    Array<ResolversTypes["SchemaModel"]>,
    ParentType,
    ContextType
  >;
  cache?: Resolver<
    Array<ResolversTypes["SchemaCache"]>,
    ParentType,
    ContextType
  >;
  pubsub?: Resolver<
    Array<ResolversTypes["SchemaPubsub"]>,
    ParentType,
    ContextType
  >;
  task?: Resolver<Array<ResolversTypes["SchemaTask"]>, ParentType, ContextType>;
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

export type SchemaCacheResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaCache"] = ResolversParentTypes["SchemaCache"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes["SchemaValue"]>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes["SchemaValue"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaPubsubResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaPubsub"] = ResolversParentTypes["SchemaPubsub"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes["SchemaValue"]>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes["SchemaValue"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SchemaTaskResolvers<
  ContextType = Context,
  ParentType extends ResolversParentTypes["SchemaTask"] = ResolversParentTypes["SchemaTask"]
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
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  SchemaValue?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  ConnectedDevice?: ConnectedDeviceResolvers<ContextType>;
  Schema?: SchemaResolvers<ContextType>;
  SchemaModel?: SchemaModelResolvers<ContextType>;
  SchemaCache?: SchemaCacheResolvers<ContextType>;
  SchemaPubsub?: SchemaPubsubResolvers<ContextType>;
  SchemaTask?: SchemaTaskResolvers<ContextType>;
};

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
