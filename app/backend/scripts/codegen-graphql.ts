import { buildSchema, printSchema, parse } from 'graphql';
import { codegen } from '@graphql-codegen/core';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

import * as typescriptPlugin from '@graphql-codegen/typescript';
import * as typescriptResolversPlugin from '@graphql-codegen/typescript-resolvers';
import * as addPlugin from '@graphql-codegen/add';

const srcPath = path.resolve(__dirname, '..', 'src');
const contextFile = path.resolve(__dirname, '..', 'src', 'context');

const schemaGen = (schemaFile) => {
  const outputFile = path.resolve(path.dirname(schemaFile), `${path.basename(schemaFile, '.graphql')}-resolvers-generated.ts`);
  const schema = buildSchema(fs.readFileSync(schemaFile, 'utf8'));

  // : Types.GenerateOptions
  const config = {
    filename: outputFile,
    schema: parse(printSchema(schema)), 
    plugins: [
      {
        typescript: {},
      },
      {
        typescriptResolvers: {
          contextType: `./${path.relative(path.dirname(outputFile), contextFile)}#Context`,
          federation: false,
        },
      },
      {
        add: {
          content: '/* eslint-disable */',
          placement: "prepend",
        },
      },
    ],
    pluginMap: {
      typescript: typescriptPlugin,
      typescriptResolvers: typescriptResolversPlugin,
      add: addPlugin,
    },
  };

  codegen(config).then((output) => {
    fs.writeFileSync(outputFile, output);
    console.log(`${outputFile} generated!`);
  });
};

glob(path.resolve(srcPath, '**', '*.graphql'), {}, (err, files) => {
  files.forEach(schemaGen);
});