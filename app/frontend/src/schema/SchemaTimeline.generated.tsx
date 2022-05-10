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
export type SchemaTimelineQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type SchemaTimelineQuery = (
  { __typename?: 'Query' }
  & { schema: (
    { __typename?: 'Schema' }
    & { platforms: Array<(
      { __typename?: 'SchemaPlatform' }
      & Pick<Types.SchemaPlatform, 'id' | 'type'>
      & { resources: Array<(
        { __typename?: 'SchemaResource' }
        & Pick<Types.SchemaResource, 'id' | 'type'>
        & { actions: Array<(
          { __typename?: 'SchemaAction' }
          & Pick<Types.SchemaAction, 'id' | 'name' | 'returns'>
          & { connectedDevices: Array<(
            { __typename?: 'ConnectedDevice' }
            & Pick<Types.ConnectedDevice, 'id' | 'name' | 'language' | 'secondsConnected'>
          )> }
        )> }
      )> }
    )> }
  ) }
);

export type SchemaTimelineOperationsSubscriptionVariables = Types.Exact<{ [key: string]: never; }>;


export type SchemaTimelineOperationsSubscription = (
  { __typename?: 'Subscription' }
  & { schemaOperations: Array<(
    { __typename?: 'SchemaOperation' }
    & { operation: (
      { __typename?: 'ActionOperation' }
      & Pick<Types.ActionOperation, 'id' | 'actionId' | 'connectedDeviceId' | 'createMsAgo' | 'type'>
      & { data: (
        { __typename?: 'CacheOperation' }
        & { cacheType: Types.CacheOperation['type'] }
      ) | (
        { __typename?: 'PubsubOperation' }
        & { pubsubType: Types.PubsubOperation['type'] }
        & { publishTo?: Types.Maybe<Array<(
          { __typename?: 'PubsubOperationPublishTo' }
          & Pick<Types.PubsubOperationPublishTo, 'connectedDeviceId' | 'callbackEndedMsAgo'>
        )>> }
      ) | (
        { __typename?: 'TaskOperation' }
        & Pick<Types.TaskOperation, 'key' | 'payload'>
        & { taskType: Types.TaskOperation['type'] }
        & { queueTo?: Types.Maybe<(
          { __typename?: 'TaskOperationQueueTo' }
          & Pick<Types.TaskOperationQueueTo, 'connectedDeviceId' | 'callbackEndedMsAgo' | 'returns' | 'returnCallbackStartedMsAgo' | 'returnCallbackEndedMsAgo'>
        )> }
      ) }
    ) }
  )> }
);


export const SchemaTimelineDocument = gql`
    query SchemaTimeline {
  schema {
    platforms {
      id
      type
      resources {
        id
        type
        actions {
          id
          name
          returns
          connectedDevices {
            id
            name
            language
            secondsConnected
          }
        }
      }
    }
  }
}
    `;
export type SchemaTimelineComponentProps = Omit<ApolloReactComponents.QueryComponentOptions<SchemaTimelineQuery, SchemaTimelineQueryVariables>, 'query'>;

    export const SchemaTimelineComponent = (props: SchemaTimelineComponentProps) => (
      <ApolloReactComponents.Query<SchemaTimelineQuery, SchemaTimelineQueryVariables> query={SchemaTimelineDocument} {...props} />
    );
    
export type SchemaTimelineProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<SchemaTimelineQuery, SchemaTimelineQueryVariables>
    } & TChildProps;
export function withSchemaTimeline<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  SchemaTimelineQuery,
  SchemaTimelineQueryVariables,
  SchemaTimelineProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withQuery<TProps, SchemaTimelineQuery, SchemaTimelineQueryVariables, SchemaTimelineProps<TChildProps, TDataName>>(SchemaTimelineDocument, {
      alias: 'schemaTimeline',
      ...operationOptions
    });
};

/**
 * __useSchemaTimelineQuery__
 *
 * To run a query within a React component, call `useSchemaTimelineQuery` and pass it any options that fit your needs.
 * When your component renders, `useSchemaTimelineQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSchemaTimelineQuery({
 *   variables: {
 *   },
 * });
 */
export function useSchemaTimelineQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<SchemaTimelineQuery, SchemaTimelineQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SchemaTimelineQuery, SchemaTimelineQueryVariables>(SchemaTimelineDocument, options);
      }
export function useSchemaTimelineLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SchemaTimelineQuery, SchemaTimelineQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SchemaTimelineQuery, SchemaTimelineQueryVariables>(SchemaTimelineDocument, options);
        }
export type SchemaTimelineQueryHookResult = ReturnType<typeof useSchemaTimelineQuery>;
export type SchemaTimelineLazyQueryHookResult = ReturnType<typeof useSchemaTimelineLazyQuery>;
export const SchemaTimelineOperationsDocument = gql`
    subscription SchemaTimelineOperations {
  schemaOperations {
    operation {
      id
      actionId
      connectedDeviceId
      createMsAgo
      type
      data {
        ... on CacheOperation {
          cacheType: type
        }
        ... on PubsubOperation {
          pubsubType: type
          publishTo {
            connectedDeviceId
            callbackEndedMsAgo
          }
        }
        ... on TaskOperation {
          taskType: type
          key
          payload
          queueTo {
            connectedDeviceId
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
export type SchemaTimelineOperationsComponentProps = Omit<ApolloReactComponents.SubscriptionComponentOptions<SchemaTimelineOperationsSubscription, SchemaTimelineOperationsSubscriptionVariables>, 'subscription'>;

    export const SchemaTimelineOperationsComponent = (props: SchemaTimelineOperationsComponentProps) => (
      <ApolloReactComponents.Subscription<SchemaTimelineOperationsSubscription, SchemaTimelineOperationsSubscriptionVariables> subscription={SchemaTimelineOperationsDocument} {...props} />
    );
    
export type SchemaTimelineOperationsProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<SchemaTimelineOperationsSubscription, SchemaTimelineOperationsSubscriptionVariables>
    } & TChildProps;
export function withSchemaTimelineOperations<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  SchemaTimelineOperationsSubscription,
  SchemaTimelineOperationsSubscriptionVariables,
  SchemaTimelineOperationsProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withSubscription<TProps, SchemaTimelineOperationsSubscription, SchemaTimelineOperationsSubscriptionVariables, SchemaTimelineOperationsProps<TChildProps, TDataName>>(SchemaTimelineOperationsDocument, {
      alias: 'schemaTimelineOperations',
      ...operationOptions
    });
};

/**
 * __useSchemaTimelineOperationsSubscription__
 *
 * To run a query within a React component, call `useSchemaTimelineOperationsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useSchemaTimelineOperationsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSchemaTimelineOperationsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useSchemaTimelineOperationsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<SchemaTimelineOperationsSubscription, SchemaTimelineOperationsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<SchemaTimelineOperationsSubscription, SchemaTimelineOperationsSubscriptionVariables>(SchemaTimelineOperationsDocument, options);
      }
export type SchemaTimelineOperationsSubscriptionHookResult = ReturnType<typeof useSchemaTimelineOperationsSubscription>;