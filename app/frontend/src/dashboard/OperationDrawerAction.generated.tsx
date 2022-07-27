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
export type ActionDataQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type ActionDataQuery = (
  { __typename?: 'Query' }
  & { action: (
    { __typename?: 'SchemaAction' }
    & Pick<Types.SchemaAction, 'id' | 'name' | 'key' | 'payload' | 'returns'>
  ) }
);


export const ActionDataDocument = gql`
    query ActionData($id: ID!) {
  action(id: $id) {
    id
    name
    key
    payload
    returns
  }
}
    `;
export type ActionDataComponentProps = Omit<ApolloReactComponents.QueryComponentOptions<ActionDataQuery, ActionDataQueryVariables>, 'query'> & ({ variables: ActionDataQueryVariables; skip?: boolean; } | { skip: boolean; });

    export const ActionDataComponent = (props: ActionDataComponentProps) => (
      <ApolloReactComponents.Query<ActionDataQuery, ActionDataQueryVariables> query={ActionDataDocument} {...props} />
    );
    
export type ActionDataProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<ActionDataQuery, ActionDataQueryVariables>
    } & TChildProps;
export function withActionData<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  ActionDataQuery,
  ActionDataQueryVariables,
  ActionDataProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withQuery<TProps, ActionDataQuery, ActionDataQueryVariables, ActionDataProps<TChildProps, TDataName>>(ActionDataDocument, {
      alias: 'actionData',
      ...operationOptions
    });
};

/**
 * __useActionDataQuery__
 *
 * To run a query within a React component, call `useActionDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useActionDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useActionDataQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useActionDataQuery(baseOptions: ApolloReactHooks.QueryHookOptions<ActionDataQuery, ActionDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ActionDataQuery, ActionDataQueryVariables>(ActionDataDocument, options);
      }
export function useActionDataLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ActionDataQuery, ActionDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ActionDataQuery, ActionDataQueryVariables>(ActionDataDocument, options);
        }
export type ActionDataQueryHookResult = ReturnType<typeof useActionDataQuery>;
export type ActionDataLazyQueryHookResult = ReturnType<typeof useActionDataLazyQuery>;