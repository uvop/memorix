import { ApolloProvider } from "./apollo/ApolloProvider";
import { MuiProvider } from "./MuiProvider";

export const Provider = ({ children }: { children?: React.ReactNode }) => (
  <ApolloProvider>
    <MuiProvider>{children}</MuiProvider>
  </ApolloProvider>
);
