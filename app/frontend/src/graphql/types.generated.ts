/* tslint-disable */
/* eslint-disable */
// @ts-nocheck
import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type ConnectedDevice = {
  __typename?: 'ConnectedDevice';
  id: Scalars['ID'];
  language: Language;
  secondsConnected: Scalars['Int'];
};

export type Event = {
  __typename?: 'Event';
  id: Scalars['ID'];
  type: EventType;
  refId: Scalars['ID'];
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

export type PropertyValue = SchemaValue | SchemaObject;

export type Query = {
  __typename?: 'Query';
  test: Scalars['Boolean'];
  schema: Schema;
};

export type Schema = {
  __typename?: 'Schema';
  models: Array<SchemaModel>;
  cache: Array<SchemaCache>;
};

export type SchemaCache = {
  __typename?: 'SchemaCache';
  id: Scalars['ID'];
  name: Scalars['String'];
  key?: Maybe<PropertyValue>;
  payload: PropertyValue;
};

export type SchemaModel = {
  __typename?: 'SchemaModel';
  id: Scalars['ID'];
  name: Scalars['String'];
  object: SchemaObject;
};

export type SchemaObject = {
  __typename?: 'SchemaObject';
  properties: Array<SchemaProperty>;
};

export type SchemaProperty = {
  __typename?: 'SchemaProperty';
  name: Scalars['String'];
  isOptional: Scalars['Boolean'];
  value: PropertyValue;
};

export type SchemaValue = {
  __typename?: 'SchemaValue';
  typeName: Scalars['String'];
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
  Event: ResolverTypeWrapper<Event>;
  EventType: EventType;
  Language: Language;
  Mutation: ResolverTypeWrapper<{}>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  String: ResolverTypeWrapper<Scalars['String']>;
  PropertyValue: ResolversTypes['SchemaValue'] | ResolversTypes['SchemaObject'];
  Query: ResolverTypeWrapper<{}>;
  Schema: ResolverTypeWrapper<Schema>;
  SchemaCache: ResolverTypeWrapper<Omit<SchemaCache, 'key' | 'payload'> & { key?: Maybe<ResolversTypes['PropertyValue']>, payload: ResolversTypes['PropertyValue'] }>;
  SchemaModel: ResolverTypeWrapper<SchemaModel>;
  SchemaObject: ResolverTypeWrapper<SchemaObject>;
  SchemaProperty: ResolverTypeWrapper<Omit<SchemaProperty, 'value'> & { value: ResolversTypes['PropertyValue'] }>;
  SchemaValue: ResolverTypeWrapper<SchemaValue>;
  Subscription: ResolverTypeWrapper<{}>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  ConnectedDevice: ConnectedDevice;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  Event: Event;
  Mutation: {};
  Boolean: Scalars['Boolean'];
  String: Scalars['String'];
  PropertyValue: ResolversParentTypes['SchemaValue'] | ResolversParentTypes['SchemaObject'];
  Query: {};
  Schema: Schema;
  SchemaCache: Omit<SchemaCache, 'key' | 'payload'> & { key?: Maybe<ResolversParentTypes['PropertyValue']>, payload: ResolversParentTypes['PropertyValue'] };
  SchemaModel: SchemaModel;
  SchemaObject: SchemaObject;
  SchemaProperty: Omit<SchemaProperty, 'value'> & { value: ResolversParentTypes['PropertyValue'] };
  SchemaValue: SchemaValue;
  Subscription: {};
}>;

export type ConnectedDeviceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConnectedDevice'] = ResolversParentTypes['ConnectedDevice']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  language?: Resolver<ResolversTypes['Language'], ParentType, ContextType>;
  secondsConnected?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['EventType'], ParentType, ContextType>;
  refId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  echo?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationEchoArgs, 'message'>>;
}>;

export type PropertyValueResolvers<ContextType = any, ParentType extends ResolversParentTypes['PropertyValue'] = ResolversParentTypes['PropertyValue']> = ResolversObject<{
  __resolveType: TypeResolveFn<'SchemaValue' | 'SchemaObject', ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  test?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  schema?: Resolver<ResolversTypes['Schema'], ParentType, ContextType>;
}>;

export type SchemaResolvers<ContextType = any, ParentType extends ResolversParentTypes['Schema'] = ResolversParentTypes['Schema']> = ResolversObject<{
  models?: Resolver<Array<ResolversTypes['SchemaModel']>, ParentType, ContextType>;
  cache?: Resolver<Array<ResolversTypes['SchemaCache']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SchemaCacheResolvers<ContextType = any, ParentType extends ResolversParentTypes['SchemaCache'] = ResolversParentTypes['SchemaCache']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['PropertyValue']>, ParentType, ContextType>;
  payload?: Resolver<ResolversTypes['PropertyValue'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SchemaModelResolvers<ContextType = any, ParentType extends ResolversParentTypes['SchemaModel'] = ResolversParentTypes['SchemaModel']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  object?: Resolver<ResolversTypes['SchemaObject'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SchemaObjectResolvers<ContextType = any, ParentType extends ResolversParentTypes['SchemaObject'] = ResolversParentTypes['SchemaObject']> = ResolversObject<{
  properties?: Resolver<Array<ResolversTypes['SchemaProperty']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SchemaPropertyResolvers<ContextType = any, ParentType extends ResolversParentTypes['SchemaProperty'] = ResolversParentTypes['SchemaProperty']> = ResolversObject<{
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isOptional?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['PropertyValue'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SchemaValueResolvers<ContextType = any, ParentType extends ResolversParentTypes['SchemaValue'] = ResolversParentTypes['SchemaValue']> = ResolversObject<{
  typeName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  listenToEchoes?: SubscriptionResolver<ResolversTypes['String'], "listenToEchoes", ParentType, ContextType>;
  connectedDevices?: SubscriptionResolver<Array<ResolversTypes['ConnectedDevice']>, "connectedDevices", ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  ConnectedDevice?: ConnectedDeviceResolvers<ContextType>;
  Event?: EventResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PropertyValue?: PropertyValueResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Schema?: SchemaResolvers<ContextType>;
  SchemaCache?: SchemaCacheResolvers<ContextType>;
  SchemaModel?: SchemaModelResolvers<ContextType>;
  SchemaObject?: SchemaObjectResolvers<ContextType>;
  SchemaProperty?: SchemaPropertyResolvers<ContextType>;
  SchemaValue?: SchemaValueResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
