/* tslint-disable */
/* eslint-disable */
// @ts-nocheck
import * as Types from '../graphql/types.generated';

import gql from 'graphql-tag';
import * as React from 'react';
import * as ApolloReactCommon from '@apollo/react-common';
import * as ApolloReactComponents from '@apollo/react-components';
import * as ApolloReactHoc from '@apollo/react-hoc';
import * as ApolloReactHooks from '@apollo/react-hooks';
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
const defaultOptions =  {}
export type SchemaGraphQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type SchemaGraphQuery = (
  { __typename?: 'Query' }
  & { schema: (
    { __typename?: 'Schema' }
    & { platforms: Array<(
      { __typename?: 'SchemaPlatform' }
      & Pick<Types.SchemaPlatform, 'id' | 'type'>
    )>, connectedDevices: Array<(
      { __typename?: 'ConnectedDevice' }
      & Pick<Types.ConnectedDevice, 'id' | 'name' | 'language' | 'secondsConnected'>
    )> }
  ) }
);

export type SchemaGraphOperationsSubscriptionVariables = Types.Exact<{ [key: string]: never; }>;


export type SchemaGraphOperationsSubscription = (
  { __typename?: 'Subscription' }
  & { schemaLastOperations: Array<(
    { __typename?: 'SchemaOperation' }
    & Pick<Types.SchemaOperation, 'platformId'>
    & { operation: (
      { __typename?: 'ActionOperation' }
      & Pick<Types.ActionOperation, 'id' | 'actionId' | 'connectedDeviceId' | 'createMsAgo' | 'type'>
      & { data: (
        { __typename?: 'CacheOperation' }
        & { cacheType: Types.CacheOperation['type'], cacheKey: Types.CacheOperation['key'], cachePayload: Types.CacheOperation['payload'] }
      ) | (
        { __typename?: 'PubsubOperation' }
        & { pubsubType: Types.PubsubOperation['type'], pubsubKey: Types.PubsubOperation['key'], pubsubPayload: Types.PubsubOperation['payload'] }
        & { publishTo?: Types.Maybe<Array<(
          { __typename?: 'PubsubOperationPublishTo' }
          & Pick<Types.PubsubOperationPublishTo, 'connectedDeviceId' | 'callbackStartedMsAgo' | 'callbackEndedMsAgo'>
        )>> }
      ) | (
        { __typename?: 'TaskOperation' }
        & { taskType: Types.TaskOperation['type'], taskKey: Types.TaskOperation['key'], taskPayload: Types.TaskOperation['payload'] }
        & { queueTo?: Types.Maybe<(
          { __typename?: 'TaskOperationQueueTo' }
          & Pick<Types.TaskOperationQueueTo, 'connectedDeviceId' | 'callbackStartedMsAgo' | 'callbackEndedMsAgo' | 'returns' | 'returnCallbackStartedMsAgo' | 'returnCallbackEndedMsAgo'>
        )> }
      ) }
    ) }
  )> }
);


export const SchemaGraphDocument = gql`
    query SchemaGraph {
  schema {
    platforms {
      id
      type
    }
    connectedDevices {
      id
      name
      language
      secondsConnected
    }
  }
}
    `;
export type SchemaGraphComponentProps = Omit<ApolloReactComponents.QueryComponentOptions<SchemaGraphQuery, SchemaGraphQueryVariables>, 'query'>;

    export const SchemaGraphComponent = (props: SchemaGraphComponentProps) => (
      <ApolloReactComponents.Query<SchemaGraphQuery, SchemaGraphQueryVariables> query={SchemaGraphDocument} {...props} />
    );
    
export type SchemaGraphProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<SchemaGraphQuery, SchemaGraphQueryVariables>
    } & TChildProps;
export function withSchemaGraph<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  SchemaGraphQuery,
  SchemaGraphQueryVariables,
  SchemaGraphProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withQuery<TProps, SchemaGraphQuery, SchemaGraphQueryVariables, SchemaGraphProps<TChildProps, TDataName>>(SchemaGraphDocument, {
      alias: 'schemaGraph',
      ...operationOptions
    });
};

/**
 * __useSchemaGraphQuery__
 *
 * To run a query within a React component, call `useSchemaGraphQuery` and pass it any options that fit your needs.
 * When your component renders, `useSchemaGraphQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSchemaGraphQuery({
 *   variables: {
 *   },
 * });
 */
export function useSchemaGraphQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<SchemaGraphQuery, SchemaGraphQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SchemaGraphQuery, SchemaGraphQueryVariables>(SchemaGraphDocument, options);
      }
export function useSchemaGraphLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SchemaGraphQuery, SchemaGraphQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SchemaGraphQuery, SchemaGraphQueryVariables>(SchemaGraphDocument, options);
        }
export type SchemaGraphQueryHookResult = ReturnType<typeof useSchemaGraphQuery>;
export type SchemaGraphLazyQueryHookResult = ReturnType<typeof useSchemaGraphLazyQuery>;
export const SchemaGraphOperationsDocument = gql`
    subscription SchemaGraphOperations {
  schemaLastOperations {
    platformId
    operation {
      id
      actionId
      connectedDeviceId
      createMsAgo
      type
      data {
        ... on CacheOperation {
          cacheType: type
          cacheKey: key
          cachePayload: payload
        }
        ... on PubsubOperation {
          pubsubType: type
          pubsubKey: key
          pubsubPayload: payload
          publishTo {
            connectedDeviceId
            callbackStartedMsAgo
            callbackEndedMsAgo
          }
        }
        ... on TaskOperation {
          taskType: type
          taskKey: key
          taskPayload: payload
          queueTo {
            connectedDeviceId
            callbackStartedMsAgo
            callbackEndedMsAgo
            returns
            returnCallbackStartedMsAgo
            returnCallbackEndedMsAgo
          }
        }
      }
    }
  }
}
    `;
export type SchemaGraphOperationsComponentProps = Omit<ApolloReactComponents.SubscriptionComponentOptions<SchemaGraphOperationsSubscription, SchemaGraphOperationsSubscriptionVariables>, 'subscription'>;

    export const SchemaGraphOperationsComponent = (props: SchemaGraphOperationsComponentProps) => (
      <ApolloReactComponents.Subscription<SchemaGraphOperationsSubscription, SchemaGraphOperationsSubscriptionVariables> subscription={SchemaGraphOperationsDocument} {...props} />
    );
    
export type SchemaGraphOperationsProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<SchemaGraphOperationsSubscription, SchemaGraphOperationsSubscriptionVariables>
    } & TChildProps;
export function withSchemaGraphOperations<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  SchemaGraphOperationsSubscription,
  SchemaGraphOperationsSubscriptionVariables,
  SchemaGraphOperationsProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withSubscription<TProps, SchemaGraphOperationsSubscription, SchemaGraphOperationsSubscriptionVariables, SchemaGraphOperationsProps<TChildProps, TDataName>>(SchemaGraphOperationsDocument, {
      alias: 'schemaGraphOperations',
      ...operationOptions
    });
};

/**
 * __useSchemaGraphOperationsSubscription__
 *
 * To run a query within a React component, call `useSchemaGraphOperationsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useSchemaGraphOperationsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSchemaGraphOperationsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useSchemaGraphOperationsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<SchemaGraphOperationsSubscription, SchemaGraphOperationsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<SchemaGraphOperationsSubscription, SchemaGraphOperationsSubscriptionVariables>(SchemaGraphOperationsDocument, options);
      }
export type SchemaGraphOperationsSubscriptionHookResult = ReturnType<typeof useSchemaGraphOperationsSubscription>;