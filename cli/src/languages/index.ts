import { assertUnreachable } from "src/core/utilities";
import { codegenTs } from "./ts/ts";
import { codegenPython } from "./python/python";

export enum Languages {
  typescript = "typescript",
  python = "python",
}

type CodegenByLanguageFn = (schema: string, language: Languages) => string;

export const codegenByLanguage: CodegenByLanguageFn = (scope, language) => {
  switch (language) {
    case Languages.typescript:
      return codegenTs(scope);
    case Languages.python:
      return codegenPython(scope);
    default:
      assertUnreachable(language);
      return "";
  }
};
