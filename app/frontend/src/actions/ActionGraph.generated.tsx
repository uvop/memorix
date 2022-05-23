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
export type ActionGraphQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type ActionGraphQuery = (
  { __typename?: 'Query' }
  & { action: (
    { __typename?: 'SchemaAction' }
    & Pick<Types.SchemaAction, 'id' | 'name'>
    & { connectedDevices: Array<(
      { __typename?: 'ConnectedDevice' }
      & Pick<Types.ConnectedDevice, 'id' | 'name' | 'language' | 'secondsConnected'>
    )> }
  ) }
);

export type ActionGraphOperationsSubscriptionVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type ActionGraphOperationsSubscription = (
  { __typename?: 'Subscription' }
  & { actionLastOperations: Array<(
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
  )> }
);


export const ActionGraphDocument = gql`
    query ActionGraph($id: ID!) {
  action(id: $id) {
    id
    name
    connectedDevices {
      id
      name
      language
      secondsConnected
    }
  }
}
    `;
export type ActionGraphComponentProps = Omit<ApolloReactComponents.QueryComponentOptions<ActionGraphQuery, ActionGraphQueryVariables>, 'query'> & ({ variables: ActionGraphQueryVariables; skip?: boolean; } | { skip: boolean; });

    export const ActionGraphComponent = (props: ActionGraphComponentProps) => (
      <ApolloReactComponents.Query<ActionGraphQuery, ActionGraphQueryVariables> query={ActionGraphDocument} {...props} />
    );
    
export type ActionGraphProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<ActionGraphQuery, ActionGraphQueryVariables>
    } & TChildProps;
export function withActionGraph<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  ActionGraphQuery,
  ActionGraphQueryVariables,
  ActionGraphProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withQuery<TProps, ActionGraphQuery, ActionGraphQueryVariables, ActionGraphProps<TChildProps, TDataName>>(ActionGraphDocument, {
      alias: 'actionGraph',
      ...operationOptions
    });
};

/**
 * __useActionGraphQuery__
 *
 * To run a query within a React component, call `useActionGraphQuery` and pass it any options that fit your needs.
 * When your component renders, `useActionGraphQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useActionGraphQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useActionGraphQuery(baseOptions: ApolloReactHooks.QueryHookOptions<ActionGraphQuery, ActionGraphQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ActionGraphQuery, ActionGraphQueryVariables>(ActionGraphDocument, options);
      }
export function useActionGraphLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ActionGraphQuery, ActionGraphQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ActionGraphQuery, ActionGraphQueryVariables>(ActionGraphDocument, options);
        }
export type ActionGraphQueryHookResult = ReturnType<typeof useActionGraphQuery>;
export type ActionGraphLazyQueryHookResult = ReturnType<typeof useActionGraphLazyQuery>;
export const ActionGraphOperationsDocument = gql`
    subscription ActionGraphOperations($id: ID!) {
  actionLastOperations(id: $id) {
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
    `;
export type ActionGraphOperationsComponentProps = Omit<ApolloReactComponents.SubscriptionComponentOptions<ActionGraphOperationsSubscription, ActionGraphOperationsSubscriptionVariables>, 'subscription'>;

    export const ActionGraphOperationsComponent = (props: ActionGraphOperationsComponentProps) => (
      <ApolloReactComponents.Subscription<ActionGraphOperationsSubscription, ActionGraphOperationsSubscriptionVariables> subscription={ActionGraphOperationsDocument} {...props} />
    );
    
export type ActionGraphOperationsProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<ActionGraphOperationsSubscription, ActionGraphOperationsSubscriptionVariables>
    } & TChildProps;
export function withActionGraphOperations<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  ActionGraphOperationsSubscription,
  ActionGraphOperationsSubscriptionVariables,
  ActionGraphOperationsProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withSubscription<TProps, ActionGraphOperationsSubscription, ActionGraphOperationsSubscriptionVariables, ActionGraphOperationsProps<TChildProps, TDataName>>(ActionGraphOperationsDocument, {
      alias: 'actionGraphOperations',
      ...operationOptions
    });
};

/**
 * __useActionGraphOperationsSubscription__
 *
 * To run a query within a React component, call `useActionGraphOperationsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useActionGraphOperationsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useActionGraphOperationsSubscription({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useActionGraphOperationsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<ActionGraphOperationsSubscription, ActionGraphOperationsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<ActionGraphOperationsSubscription, ActionGraphOperationsSubscriptionVariables>(ActionGraphOperationsDocument, options);
      }
export type ActionGraphOperationsSubscriptionHookResult = ReturnType<typeof useActionGraphOperationsSubscription>;