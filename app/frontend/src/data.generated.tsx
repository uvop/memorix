/* tslint-disable */
/* eslint-disable */
// @ts-nocheck
import * as Types from './graphql/types.generated';

import gql from 'graphql-tag';
import * as ApolloReactCommon from '@apollo/react-common';
import * as React from 'react';
import * as ApolloReactComponents from '@apollo/react-components';
import * as ApolloReactHoc from '@apollo/react-hoc';
import * as ApolloReactHooks from '@apollo/react-hooks';
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
const defaultOptions =  {}
export type SendMessageMutationVariables = Types.Exact<{
  message: Types.Scalars['String'];
}>;


export type SendMessageMutation = (
  { __typename?: 'Mutation' }
  & Pick<Types.Mutation, 'echo'>
);

export type ListenToMessagesSubscriptionVariables = Types.Exact<{ [key: string]: never; }>;


export type ListenToMessagesSubscription = (
  { __typename?: 'Subscription' }
  & Pick<Types.Subscription, 'listenToEchoes'>
);


export const SendMessageDocument = gql`
    mutation sendMessage($message: String!) {
  echo(message: $message)
}
    `;
export type SendMessageMutationFn = ApolloReactCommon.MutationFunction<SendMessageMutation, SendMessageMutationVariables>;
export type SendMessageComponentProps = Omit<ApolloReactComponents.MutationComponentOptions<SendMessageMutation, SendMessageMutationVariables>, 'mutation'>;

    export const SendMessageComponent = (props: SendMessageComponentProps) => (
      <ApolloReactComponents.Mutation<SendMessageMutation, SendMessageMutationVariables> mutation={SendMessageDocument} {...props} />
    );
    
export type SendMessageProps<TChildProps = {}, TDataName extends string = 'mutate'> = {
      [key in TDataName]: ApolloReactCommon.MutationFunction<SendMessageMutation, SendMessageMutationVariables>
    } & TChildProps;
export function withSendMessage<TProps, TChildProps = {}, TDataName extends string = 'mutate'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  SendMessageMutation,
  SendMessageMutationVariables,
  SendMessageProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withMutation<TProps, SendMessageMutation, SendMessageMutationVariables, SendMessageProps<TChildProps, TDataName>>(SendMessageDocument, {
      alias: 'sendMessage',
      ...operationOptions
    });
};

/**
 * __useSendMessageMutation__
 *
 * To run a mutation, you first call `useSendMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendMessageMutation, { data, loading, error }] = useSendMessageMutation({
 *   variables: {
 *      message: // value for 'message'
 *   },
 * });
 */
export function useSendMessageMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SendMessageMutation, SendMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SendMessageMutation, SendMessageMutationVariables>(SendMessageDocument, options);
      }
export type SendMessageMutationHookResult = ReturnType<typeof useSendMessageMutation>;
export type SendMessageMutationOptions = ApolloReactCommon.BaseMutationOptions<SendMessageMutation, SendMessageMutationVariables>;
export const ListenToMessagesDocument = gql`
    subscription listenToMessages {
  listenToEchoes
}
    `;
export type ListenToMessagesComponentProps = Omit<ApolloReactComponents.SubscriptionComponentOptions<ListenToMessagesSubscription, ListenToMessagesSubscriptionVariables>, 'subscription'>;

    export const ListenToMessagesComponent = (props: ListenToMessagesComponentProps) => (
      <ApolloReactComponents.Subscription<ListenToMessagesSubscription, ListenToMessagesSubscriptionVariables> subscription={ListenToMessagesDocument} {...props} />
    );
    
export type ListenToMessagesProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<ListenToMessagesSubscription, ListenToMessagesSubscriptionVariables>
    } & TChildProps;
export function withListenToMessages<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  ListenToMessagesSubscription,
  ListenToMessagesSubscriptionVariables,
  ListenToMessagesProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withSubscription<TProps, ListenToMessagesSubscription, ListenToMessagesSubscriptionVariables, ListenToMessagesProps<TChildProps, TDataName>>(ListenToMessagesDocument, {
      alias: 'listenToMessages',
      ...operationOptions
    });
};

/**
 * __useListenToMessagesSubscription__
 *
 * To run a query within a React component, call `useListenToMessagesSubscription` and pass it any options that fit your needs.
 * When your component renders, `useListenToMessagesSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListenToMessagesSubscription({
 *   variables: {
 *   },
 * });
 */
export function useListenToMessagesSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<ListenToMessagesSubscription, ListenToMessagesSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<ListenToMessagesSubscription, ListenToMessagesSubscriptionVariables>(ListenToMessagesDocument, options);
      }
export type ListenToMessagesSubscriptionHookResult = ReturnType<typeof useListenToMessagesSubscription>;