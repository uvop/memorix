import { assertUnreachable } from "src/core/utilities";
import { Block } from "src/core/block";
import { codegenTs } from "./ts/ts";
import { codegenPython } from "./python/python";

export enum Languages {
  typescript = "typescript",
  python = "python",
}

type CodegenByLanguageFn = (blocks: Block[], language: Languages) => string;

export const codegenByLanguage: CodegenByLanguageFn = (blocks, language) => {
  switch (language) {
    case Languages.typescript:
      return codegenTs(blocks);
    case Languages.python:
      return codegenPython(blocks);
    default:
      assertUnreachable(language);
      return "";
  }
};
