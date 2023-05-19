import path from "path";
import fs from "fs";
import { codegenByLanguage } from "./languages";
import { Block, BlockTypes, getBlocks } from "./core/block";

const getSchemaBlocksNoConfig = async (
  schemaFilePath: string,
  dirname?: string
): Promise<Block[]> => {
  const schemaPath =
    dirname !== undefined
      ? path.resolve(dirname, schemaFilePath)
      : path.resolve(schemaFilePath);
  const schemaFolder = path.dirname(schemaPath);
  const schema = await (await fs.promises.readFile(schemaPath)).toString();
  const blocks = getBlocks(schema);
  const blockConfig = blocks.find((x) => x.type === BlockTypes.config);
  if (
    !blockConfig ||
    blockConfig.type !== BlockTypes.config ||
    !blockConfig.extends
  ) {
    return blocks;
  }

  const blocksToAdd = await Promise.all(
    (Array.isArray(blockConfig.extends)
      ? blockConfig.extends
      : [blockConfig.extends]
    ).map(async (schemaExtendFilePath) =>
      getSchemaBlocksNoConfig(schemaFolder, schemaExtendFilePath)
    )
  );

  return [
    ...blocksToAdd.flat(),
    ...blocks.filter((x) => x.type !== BlockTypes.config),
  ];
};

export const codegen = async ({
  schemaFilePath,
}: {
  schemaFilePath: string;
}) => {
  const schemaPath = path.resolve(schemaFilePath);
  const schemaDirname = path.dirname(schemaPath);
  const schema = await (await fs.promises.readFile(schemaPath)).toString();
  const blockConfig = getBlocks(schema).find(
    (x) => x.type === BlockTypes.config
  );
  if (!blockConfig || blockConfig.type !== BlockTypes.config) {
    throw new Error(
      `Must set a Config block to top level schema "${schemaPath}"`
    );
  }
  const otherBlocks = await getSchemaBlocksNoConfig(schemaFilePath);
  const blocks = [blockConfig, ...otherBlocks];

  await Promise.all(
    Array.isArray(blockConfig.output)
      ? blockConfig.output
      : [blockConfig.output].map(async ({ language, file }) => {
          const filePath = path.resolve(schemaDirname, file);
          const code = codegenByLanguage(blocks, language);
          await fs.promises.writeFile(filePath, code);
        })
  );
};
