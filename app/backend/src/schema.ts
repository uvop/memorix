import path from "path";
import fs from "fs";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { resolvers } from "./resolvers";

const typeDefsFile = path.resolve(__dirname, "schema.graphql");
const typeDefs = fs.readFileSync(typeDefsFile, "utf8");

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
