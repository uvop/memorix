/* tslint-disable */
/* eslint-disable */
// @ts-nocheck
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { type ValueType } from 'src/value';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  SchemaValue: ValueType;
};

export type ConnectedDevice = {
  __typename?: 'ConnectedDevice';
  id: Scalars['ID'];
  language: Language;
  secondsConnected: Scalars['Int'];
};

export enum EventType {
  Get = 'GET',
  Set = 'SET'
}

export enum Language {
  Typescript = 'TYPESCRIPT'
}

export type Mutation = {
  __typename?: 'Mutation';
  echo: Scalars['Boolean'];
};


export type MutationEchoArgs = {
  message: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  test: Scalars['Boolean'];
  schema: Schema;
};

export type Schema = {
  __typename?: 'Schema';
  models: Array<SchemaModel>;
  cache: Array<SchemaCache>;
  pubsub: Array<SchemaPubsub>;
  task: Array<SchemaTask>;
};

export type SchemaCache = {
  __typename?: 'SchemaCache';
  id: Scalars['ID'];
  name: Scalars['String'];
  key?: Maybe<Scalars['SchemaValue']>;
  payload: Scalars['SchemaValue'];
};

export type SchemaModel = {
  __typename?: 'SchemaModel';
  id: Scalars['ID'];
  name: Scalars['String'];
  value: Scalars['SchemaValue'];
};

export type SchemaPubsub = {
  __typename?: 'SchemaPubsub';
  id: Scalars['ID'];
  name: Scalars['String'];
  key?: Maybe<Scalars['SchemaValue']>;
  payload: Scalars['SchemaValue'];
};

export type SchemaTask = {
  __typename?: 'SchemaTask';
  id: Scalars['ID'];
  name: Scalars['String'];
  key?: Maybe<Scalars['SchemaValue']>;
  payload: Scalars['SchemaValue'];
  returns?: Maybe<Scalars['SchemaValue']>;
};


export type Subscription = {
  __typename?: 'Subscription';
  listenToEchoes: Scalars['String'];
  connectedDevices: Array<ConnectedDevice>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

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
export type StitchingResolver<TResult, TParent, TContext, TArgs> = LegacyStitchingResolver<TResult, TParent, TContext, TArgs> | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
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

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  ConnectedDevice: ResolverTypeWrapper<ConnectedDevice>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  EventType: EventType;
  Language: Language;
  Mutation: ResolverTypeWrapper<{}>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Query: ResolverTypeWrapper<{}>;
  Schema: ResolverTypeWrapper<Schema>;
  SchemaCache: ResolverTypeWrapper<SchemaCache>;
  SchemaModel: ResolverTypeWrapper<SchemaModel>;
  SchemaPubsub: ResolverTypeWrapper<SchemaPubsub>;
  SchemaTask: ResolverTypeWrapper<SchemaTask>;
  SchemaValue: ResolverTypeWrapper<Scalars['SchemaValue']>;
  Subscription: ResolverTypeWrapper<{}>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  ConnectedDevice: ConnectedDevice;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  Mutation: {};
  Boolean: Scalars['Boolean'];
  String: Scalars['String'];
  Query: {};
  Schema: Schema;
  SchemaCache: SchemaCache;
  SchemaModel: SchemaModel;
  SchemaPubsub: SchemaPubsub;
  SchemaTask: SchemaTask;
  SchemaValue: Scalars['SchemaValue'];
  Subscription: {};
}>;

export type ConnectedDeviceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConnectedDevice'] = ResolversParentTypes['ConnectedDevice']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  language?: Resolver<ResolversTypes['Language'], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  echo?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationEchoArgs, 'message'>>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  test?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  schema?: Resolver<ResolversTypes['Schema'], ParentType, ContextType>;
}>;

export type SchemaResolvers<ContextType = any, ParentType extends ResolversParentTypes['Schema'] = ResolversParentTypes['Schema']> = ResolversObject<{
  models?: Resolver<Array<ResolversTypes['SchemaModel']>, ParentType, ContextType>;
  cache?: Resolver<Array<ResolversTypes['SchemaCache']>, ParentType, ContextType>;
  pubsub?: Resolver<Array<ResolversTypes['SchemaPubsub']>, ParentType, ContextType>;
  task?: Resolver<Array<ResolversTypes['SchemaTask']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SchemaCacheResolvers<ContextType = any, ParentType extends ResolversParentTypes['SchemaCache'] = ResolversParentTypes['SchemaCache']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['SchemaValue']>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes['SchemaValue'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SchemaModelResolvers<ContextType = any, ParentType extends ResolversParentTypes['SchemaModel'] = ResolversParentTypes['SchemaModel']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['SchemaValue'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SchemaPubsubResolvers<ContextType = any, ParentType extends ResolversParentTypes['SchemaPubsub'] = ResolversParentTypes['SchemaPubsub']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['SchemaValue']>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes['SchemaValue'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SchemaTaskResolvers<ContextType = any, ParentType extends ResolversParentTypes['SchemaTask'] = ResolversParentTypes['SchemaTask']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['SchemaValue']>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes['SchemaValue'], ParentType, ContextType>;
  returns?: Resolver<Maybe<ResolversTypes['SchemaValue']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface SchemaValueScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['SchemaValue'], any> {
  name: 'SchemaValue';
}

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  listenToEchoes?: SubscriptionResolver<ResolversTypes['String'], "listenToEchoes", ParentType, ContextType>;
  connectedDevices?: SubscriptionResolver<Array<ResolversTypes['ConnectedDevice']>, "connectedDevices", ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  ConnectedDevice?: ConnectedDeviceResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Schema?: SchemaResolvers<ContextType>;
  SchemaCache?: SchemaCacheResolvers<ContextType>;
  SchemaModel?: SchemaModelResolvers<ContextType>;
  SchemaPubsub?: SchemaPubsubResolvers<ContextType>;
  SchemaTask?: SchemaTaskResolvers<ContextType>;
  SchemaValue?: GraphQLScalarType;
  Subscription?: SubscriptionResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
