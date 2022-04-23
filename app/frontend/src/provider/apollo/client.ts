import ApolloClient from "apollo-client";
import {
  InMemoryCache,
  IntrospectionFragmentMatcher,
} from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import { throttle } from "lodash";
import introspectionResult from "src/graphql/introspection-result.generated";

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData: introspectionResult,
});

const cache = new InMemoryCache({ fragmentMatcher });

const throttleLog = throttle(console.log.bind(console), 120, {
  leading: false,
  trailing: true,
});

const contextLink = setContext(async (operation, { headers }) => {
  if (process.env.REACT_APP_IS_DEV === "true") {
    throttleLog(JSON.stringify([operation.operationName, operation.variables]));
  }

  const auth: any = await localStorage.getItem("auth");

  return {
    headers: {
      ...headers,
      Authorization: auth
        ? `Bearer ${auth.social?.accessToken || auth.guestAccessToken}`
        : "",
      "client-version": 1,
    },
  };
});

const ssrMode = typeof window === "undefined";

let link;
if (ssrMode) {
  link = ApolloLink.from([
    contextLink,
    ApolloLink.split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      new HttpLink({
        uri: "/graphql",
      })
    ),
  ]);
} else {
  const webSocketHost = "localhost:8080";

  const wsLink = new WebSocketLink({
    uri: `ws://${webSocketHost}/graphql`,
    options: {
      reconnect: true,
    },
  });
  link = ApolloLink.from([
    contextLink,
    ApolloLink.split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      new HttpLink({
        uri: "/graphql",
      })
    ),
  ]);
}

export const apolloClient = new ApolloClient({
  ssrMode,
  link,
  cache,
});
