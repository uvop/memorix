import path from "path";
import fs from "fs";
import { codegenByLanguage } from "./languages";
import { getNamespaces, Namespaces } from "./core/block";
import { getConfig } from "./core/config";

const getAllNamespaces = async (
  schemaFilePath: string,
  dirname?: string
): Promise<Namespaces> => {
  const schemaPath =
    dirname !== undefined
      ? path.resolve(dirname, schemaFilePath)
      : path.resolve(schemaFilePath);
  const schemaFolder = path.dirname(schemaPath);
  const schema = await (await fs.promises.readFile(schemaPath)).toString();
  const ns = getNamespaces(schema);
  const config = getConfig(schema);
  if (!config) {
    return ns;
  }

  const nsToAdd = await Promise.all(
    (Array.isArray(config.extends) ? config.extends : [config.extends]).map(
      async (schemaExtendFilePath) =>
        getAllNamespaces(schemaExtendFilePath, schemaFolder)
    )
  );

  return {
    global: {
      defaults: ns.global.defaults,
      blocks: [
        ...ns.global.blocks,
        ...nsToAdd.map((x) => x.global.blocks).flat(),
      ],
    },
    named: [...ns.named, ...nsToAdd.map((x) => x.named).flat()],
  };
};

export const codegen = async ({
  schemaFilePath,
}: {
  schemaFilePath: string;
}) => {
  const schemaPath = path.resolve(schemaFilePath);
  const schemaDirname = path.dirname(schemaPath);
  const schema = await (await fs.promises.readFile(schemaPath)).toString();
  const config = getConfig(schema);
  if (!config) {
    throw new Error(`Must set a Config in top level schema "${schemaPath}"`);
  }
  const ns = await getAllNamespaces(schemaFilePath);

  await Promise.all(
    (Array.isArray(config.output) ? config.output : [config.output]).map(
      async ({ language, file }) => {
        const filePath = path.resolve(schemaDirname, file);
        const code = codegenByLanguage(ns, language);
        await fs.promises.writeFile(filePath, code);
      }
    )
  );
};
