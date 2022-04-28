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
export type GraphDetailsSubscriptionVariables = Types.Exact<{ [key: string]: never; }>;


export type GraphDetailsSubscription = (
  { __typename?: 'Subscription' }
  & { connectedDevices: Array<(
    { __typename?: 'ConnectedDevice' }
    & Pick<Types.ConnectedDevice, 'id' | 'language' | 'secondsConnected'>
  )> }
);


export const GraphDetailsDocument = gql`
    subscription graphDetails {
  connectedDevices {
    id
    language
    secondsConnected
  }
}
    `;
export type GraphDetailsComponentProps = Omit<ApolloReactComponents.SubscriptionComponentOptions<GraphDetailsSubscription, GraphDetailsSubscriptionVariables>, 'subscription'>;

    export const GraphDetailsComponent = (props: GraphDetailsComponentProps) => (
      <ApolloReactComponents.Subscription<GraphDetailsSubscription, GraphDetailsSubscriptionVariables> subscription={GraphDetailsDocument} {...props} />
    );
    
export type GraphDetailsProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<GraphDetailsSubscription, GraphDetailsSubscriptionVariables>
    } & TChildProps;
export function withGraphDetails<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  GraphDetailsSubscription,
  GraphDetailsSubscriptionVariables,
  GraphDetailsProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withSubscription<TProps, GraphDetailsSubscription, GraphDetailsSubscriptionVariables, GraphDetailsProps<TChildProps, TDataName>>(GraphDetailsDocument, {
      alias: 'graphDetails',
      ...operationOptions
    });
};

/**
 * __useGraphDetailsSubscription__
 *
 * To run a query within a React component, call `useGraphDetailsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useGraphDetailsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGraphDetailsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useGraphDetailsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<GraphDetailsSubscription, GraphDetailsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<GraphDetailsSubscription, GraphDetailsSubscriptionVariables>(GraphDetailsDocument, options);
      }
export type GraphDetailsSubscriptionHookResult = ReturnType<typeof useGraphDetailsSubscription>;