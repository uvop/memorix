import { ApolloServer } from "apollo-server";
import { createContext } from "./context";
import { schema } from "./schema";

const { PORT = 8080 } = process.env;

const start = async () => {
  const ctx = createContext();

  const server = new ApolloServer({
    subscriptions: {
      path: "/graphql",
    },
    schema,
    context: ctx,
  });

  const { url } = await server.listen({
    port: PORT,
    url: "/graphql",
  });

  console.log(`🚀  Server ready at ${url}graphql`);
};

start();
