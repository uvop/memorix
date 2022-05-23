/* tslint-disable */
/* eslint-disable */
// @ts-nocheck
import * as Types from '../core/graphql/types.generated';

import gql from 'graphql-tag';
import * as React from 'react';
import * as ApolloReactCommon from '@apollo/react-common';
import * as ApolloReactComponents from '@apollo/react-components';
import * as ApolloReactHoc from '@apollo/react-hoc';
import * as ApolloReactHooks from '@apollo/react-hooks';
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
const defaultOptions =  {}
export type ResourceGraphQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type ResourceGraphQuery = (
  { __typename?: 'Query' }
  & { resource: (
    { __typename?: 'SchemaResource' }
    & Pick<Types.SchemaResource, 'id'>
    & { actions: Array<(
      { __typename?: 'SchemaAction' }
      & Pick<Types.SchemaAction, 'id' | 'name'>
    )>, connectedDevices: Array<(
      { __typename?: 'ConnectedDevice' }
      & Pick<Types.ConnectedDevice, 'id' | 'name' | 'language' | 'secondsConnected'>
    )> }
  ) }
);

export type ResourceGraphOperationsSubscriptionVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type ResourceGraphOperationsSubscription = (
  { __typename?: 'Subscription' }
  & { resourceLastOperations: Array<(
    { __typename?: 'ResourceOperation' }
    & Pick<Types.ResourceOperation, 'actionId'>
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


export const ResourceGraphDocument = gql`
    query ResourceGraph($id: ID!) {
  resource(id: $id) {
    id
    actions {
      id
      name
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
export type ResourceGraphComponentProps = Omit<ApolloReactComponents.QueryComponentOptions<ResourceGraphQuery, ResourceGraphQueryVariables>, 'query'> & ({ variables: ResourceGraphQueryVariables; skip?: boolean; } | { skip: boolean; });

    export const ResourceGraphComponent = (props: ResourceGraphComponentProps) => (
      <ApolloReactComponents.Query<ResourceGraphQuery, ResourceGraphQueryVariables> query={ResourceGraphDocument} {...props} />
    );
    
export type ResourceGraphProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<ResourceGraphQuery, ResourceGraphQueryVariables>
    } & TChildProps;
export function withResourceGraph<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  ResourceGraphQuery,
  ResourceGraphQueryVariables,
  ResourceGraphProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withQuery<TProps, ResourceGraphQuery, ResourceGraphQueryVariables, ResourceGraphProps<TChildProps, TDataName>>(ResourceGraphDocument, {
      alias: 'resourceGraph',
      ...operationOptions
    });
};

/**
 * __useResourceGraphQuery__
 *
 * To run a query within a React component, call `useResourceGraphQuery` and pass it any options that fit your needs.
 * When your component renders, `useResourceGraphQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useResourceGraphQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useResourceGraphQuery(baseOptions: ApolloReactHooks.QueryHookOptions<ResourceGraphQuery, ResourceGraphQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ResourceGraphQuery, ResourceGraphQueryVariables>(ResourceGraphDocument, options);
      }
export function useResourceGraphLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ResourceGraphQuery, ResourceGraphQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ResourceGraphQuery, ResourceGraphQueryVariables>(ResourceGraphDocument, options);
        }
export type ResourceGraphQueryHookResult = ReturnType<typeof useResourceGraphQuery>;
export type ResourceGraphLazyQueryHookResult = ReturnType<typeof useResourceGraphLazyQuery>;
export const ResourceGraphOperationsDocument = gql`
    subscription ResourceGraphOperations($id: ID!) {
  resourceLastOperations(id: $id) {
    actionId
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
export type ResourceGraphOperationsComponentProps = Omit<ApolloReactComponents.SubscriptionComponentOptions<ResourceGraphOperationsSubscription, ResourceGraphOperationsSubscriptionVariables>, 'subscription'>;

    export const ResourceGraphOperationsComponent = (props: ResourceGraphOperationsComponentProps) => (
      <ApolloReactComponents.Subscription<ResourceGraphOperationsSubscription, ResourceGraphOperationsSubscriptionVariables> subscription={ResourceGraphOperationsDocument} {...props} />
    );
    
export type ResourceGraphOperationsProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<ResourceGraphOperationsSubscription, ResourceGraphOperationsSubscriptionVariables>
    } & TChildProps;
export function withResourceGraphOperations<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  ResourceGraphOperationsSubscription,
  ResourceGraphOperationsSubscriptionVariables,
  ResourceGraphOperationsProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withSubscription<TProps, ResourceGraphOperationsSubscription, ResourceGraphOperationsSubscriptionVariables, ResourceGraphOperationsProps<TChildProps, TDataName>>(ResourceGraphOperationsDocument, {
      alias: 'resourceGraphOperations',
      ...operationOptions
    });
};

/**
 * __useResourceGraphOperationsSubscription__
 *
 * To run a query within a React component, call `useResourceGraphOperationsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useResourceGraphOperationsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useResourceGraphOperationsSubscription({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useResourceGraphOperationsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<ResourceGraphOperationsSubscription, ResourceGraphOperationsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<ResourceGraphOperationsSubscription, ResourceGraphOperationsSubscriptionVariables>(ResourceGraphOperationsDocument, options);
      }
export type ResourceGraphOperationsSubscriptionHookResult = ReturnType<typeof useResourceGraphOperationsSubscription>;