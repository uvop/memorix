import { promises as fs } from "fs";
import path from "path";
import glob from "glob-promise";

const main = async () => {
  const [, , baseDirRelativePath, absoluteImport] = process.argv;
  const baseDir = path.resolve(baseDirRelativePath);

  const files = await glob(path.join(baseDir, "**/*.js"));

  await Promise.all(
    files.map(async (file) => {
      const fileToBaseDir = path.relative(
        path.dirname(file),
        baseDirRelativePath
      );
      const fileContent = await fs.readFile(file, "utf8");
      const newFileContent = fileContent.replace(
        new RegExp(`require\\("${absoluteImport}`, "g"),
        `require("${path.join(fileToBaseDir, absoluteImport)}`
      );
      await fs.writeFile(file, newFileContent);
    })
  );
};

main();