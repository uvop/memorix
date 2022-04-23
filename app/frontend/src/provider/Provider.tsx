import { ApolloProvider } from "./apollo/ApolloProvider";

export const Provider = ({ children }: { children?: React.ReactNode }) => (
  <ApolloProvider>{children}</ApolloProvider>
);
