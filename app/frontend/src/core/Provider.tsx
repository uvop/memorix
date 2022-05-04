import { CacheProvider } from "@emotion/react";
import { ApolloProvider } from "@apollo/react-hooks";
import { apolloClient } from "src/core/apollo/apolloClient";
import { ThemeProvider } from "@mui/material/styles";
import { muiTheme } from "./mui/muiTheme";
import createCache from "@emotion/cache";

const emotionCache = createCache({ key: "css" });

export const Provider = ({ children }: React.PropsWithChildren<{}>) => (
  <ApolloProvider client={apolloClient as any}>
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </CacheProvider>
  </ApolloProvider>
);
