import React from "react";
import { ApolloProvider as Provider } from "@apollo/react-hooks";
import { apolloClient } from "./client";

export const ApolloProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => <Provider client={apolloClient as any}>{children}</Provider>;
