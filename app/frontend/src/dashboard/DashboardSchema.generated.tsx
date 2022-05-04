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
export type SchemaDetailsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type SchemaDetailsQuery = (
  { __typename?: 'Query' }
  & { schema: (
    { __typename?: 'Schema' }
    & { cache: Array<(
      { __typename?: 'SchemaCache' }
      & Pick<Types.SchemaCache, 'id' | 'name' | 'key' | 'payload'>
    )> }
  ) }
);


export const SchemaDetailsDocument = gql`
    query schemaDetails {
  schema {
    cache {
      id
      name
      key
      payload
    }
  }
}
    `;
export type SchemaDetailsComponentProps = Omit<ApolloReactComponents.QueryComponentOptions<SchemaDetailsQuery, SchemaDetailsQueryVariables>, 'query'>;

    export const SchemaDetailsComponent = (props: SchemaDetailsComponentProps) => (
      <ApolloReactComponents.Query<SchemaDetailsQuery, SchemaDetailsQueryVariables> query={SchemaDetailsDocument} {...props} />
    );
    
export type SchemaDetailsProps<TChildProps = {}, TDataName extends string = 'data'> = {
      [key in TDataName]: ApolloReactHoc.DataValue<SchemaDetailsQuery, SchemaDetailsQueryVariables>
    } & TChildProps;
export function withSchemaDetails<TProps, TChildProps = {}, TDataName extends string = 'data'>(operationOptions?: ApolloReactHoc.OperationOption<
  TProps,
  SchemaDetailsQuery,
  SchemaDetailsQueryVariables,
  SchemaDetailsProps<TChildProps, TDataName>>) {
    return ApolloReactHoc.withQuery<TProps, SchemaDetailsQuery, SchemaDetailsQueryVariables, SchemaDetailsProps<TChildProps, TDataName>>(SchemaDetailsDocument, {
      alias: 'schemaDetails',
      ...operationOptions
    });
};

/**
 * __useSchemaDetailsQuery__
 *
 * To run a query within a React component, call `useSchemaDetailsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSchemaDetailsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSchemaDetailsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSchemaDetailsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<SchemaDetailsQuery, SchemaDetailsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SchemaDetailsQuery, SchemaDetailsQueryVariables>(SchemaDetailsDocument, options);
      }
export function useSchemaDetailsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SchemaDetailsQuery, SchemaDetailsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SchemaDetailsQuery, SchemaDetailsQueryVariables>(SchemaDetailsDocument, options);
        }
export type SchemaDetailsQueryHookResult = ReturnType<typeof useSchemaDetailsQuery>;
export type SchemaDetailsLazyQueryHookResult = ReturnType<typeof useSchemaDetailsLazyQuery>;