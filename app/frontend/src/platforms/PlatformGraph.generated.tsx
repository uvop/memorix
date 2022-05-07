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
export type PlatformGraphQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type PlatformGraphQuery = (
  { __typename?: 'Query' }
  & { platform: (
    { __typename?: 'SchemaPlatform' }
    & Pick<Types.SchemaPlatform, 'id'>
    & { resources: Array<(
      { __typename?: 'SchemaResource' }
      & Pick<Types.SchemaResource, 'id' | 'type'>
    )>, connectedDevices: Array<(
      { __typename?: 'ConnectedDevice' }
      & Pick<Types.ConnectedDevice, 'id' | 'name' | 'language' | 'secondsConnected'>
    )> }
  ) }
);

export type PlatformGraphOperationsSubscriptionVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type PlatformGraphOperationsSubscription = (
  { __typename?: 'Subscription' }
  & { platformLastOperations: Array<(
    { __typename?: 'PlatformOperation' }
    & Pick<Types.PlatformOperation, 'resourceId'>
    & { operation: (
      { __typename?: 'ActionOperation' }
      & Pick<Types.ActionOperation, 'id' | 'connectedDeviceId' | 'createMsAgo' | 'type'>
      & { data: (
        { __typename?: 'CacheOperation' }
        & { cacheType: Types.CacheOperation['type'] }
      ) | (
        { __typename?: 'PubsubOperation' }
        & { pubsubType: Types.PubsubOperation['type'] }
        & { publishTo?: Types.Maybe<Array<(
          { __typename?: 'PubsubOperationPublishTo' }
          & Pick<Types.PubsubOperationPublishTo, 'connectedDeviceId'>
        )>> }
      ) | (
        { __typename?: 'TaskOperation' }
        & { taskType: Types.TaskOperation['type'] }
        & { queueTo?: Types.Maybe<(
          { __typename?: 'TaskOperationQueueTo' }
          & Pick<Types.TaskOperationQueueTo, 'connectedDeviceId' | 'returns' | 'returnCallbackStartedMsAgo'>
        )> }
      ) }
    ) }
  )> }
);


export const PlatformGraphDocument = gql`
    query PlatformGraph($id: ID!) {
  platform(id: $id) {
    id
    resources {
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
export type PlatformGraphComponentProps = Omit<ApolloReactComponents.QueryComponentOptions<PlatformGraphQuery, PlatformGraphQueryVariables>, 'query'> & ({ variables: PlatformGraphQueryVariables; skip?: boolean; } | { skip: boolean; });

    export const PlatformGraphComponent = (props: PlatformGraphComponentProps) => (
      <ApolloReactComponents.Query<PlatformGraphQuery, PlatformGraphQueryVariables> query={PlatformGraphDocument} {...props} />
    );
    
export type PlatformGraphProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<PlatformGraphQuery, PlatformGraphQueryVariables>
    } & TChildProps;
export function withPlatformGraph<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  PlatformGraphQuery,
  PlatformGraphQueryVariables,
  PlatformGraphProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withQuery<TProps, PlatformGraphQuery, PlatformGraphQueryVariables, PlatformGraphProps<TChildProps, TDataName>>(PlatformGraphDocument, {
      alias: 'platformGraph',
      ...operationOptions
    });
};

/**
 * __usePlatformGraphQuery__
 *
 * To run a query within a React component, call `usePlatformGraphQuery` and pass it any options that fit your needs.
 * When your component renders, `usePlatformGraphQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePlatformGraphQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function usePlatformGraphQuery(baseOptions: ApolloReactHooks.QueryHookOptions<PlatformGraphQuery, PlatformGraphQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PlatformGraphQuery, PlatformGraphQueryVariables>(PlatformGraphDocument, options);
      }
export function usePlatformGraphLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PlatformGraphQuery, PlatformGraphQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PlatformGraphQuery, PlatformGraphQueryVariables>(PlatformGraphDocument, options);
        }
export type PlatformGraphQueryHookResult = ReturnType<typeof usePlatformGraphQuery>;
export type PlatformGraphLazyQueryHookResult = ReturnType<typeof usePlatformGraphLazyQuery>;
export const PlatformGraphOperationsDocument = gql`
    subscription PlatformGraphOperations($id: ID!) {
  platformLastOperations(id: $id) {
    resourceId
    operation {
      id
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
          }
        }
        ... on TaskOperation {
          taskType: type
          queueTo {
            connectedDeviceId
            returns
            returnCallbackStartedMsAgo
          }
        }
      }
    }
  }
}
    `;
export type PlatformGraphOperationsComponentProps = Omit<ApolloReactComponents.SubscriptionComponentOptions<PlatformGraphOperationsSubscription, PlatformGraphOperationsSubscriptionVariables>, 'subscription'>;

    export const PlatformGraphOperationsComponent = (props: PlatformGraphOperationsComponentProps) => (
      <ApolloReactComponents.Subscription<PlatformGraphOperationsSubscription, PlatformGraphOperationsSubscriptionVariables> subscription={PlatformGraphOperationsDocument} {...props} />
    );
    
export type PlatformGraphOperationsProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<PlatformGraphOperationsSubscription, PlatformGraphOperationsSubscriptionVariables>
    } & TChildProps;
export function withPlatformGraphOperations<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  PlatformGraphOperationsSubscription,
  PlatformGraphOperationsSubscriptionVariables,
  PlatformGraphOperationsProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withSubscription<TProps, PlatformGraphOperationsSubscription, PlatformGraphOperationsSubscriptionVariables, PlatformGraphOperationsProps<TChildProps, TDataName>>(PlatformGraphOperationsDocument, {
      alias: 'platformGraphOperations',
      ...operationOptions
    });
};

/**
 * __usePlatformGraphOperationsSubscription__
 *
 * To run a query within a React component, call `usePlatformGraphOperationsSubscription` and pass it any options that fit your needs.
 * When your component renders, `usePlatformGraphOperationsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePlatformGraphOperationsSubscription({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function usePlatformGraphOperationsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<PlatformGraphOperationsSubscription, PlatformGraphOperationsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<PlatformGraphOperationsSubscription, PlatformGraphOperationsSubscriptionVariables>(PlatformGraphOperationsDocument, options);
      }
export type PlatformGraphOperationsSubscriptionHookResult = ReturnType<typeof usePlatformGraphOperationsSubscription>;