import { assertUnreachable } from "src/core/utilities";
import { Namespace } from "src/core/namespace";
import { codegen as codegenTs } from "./ts/ts";
import { codegen as codegenPython } from "./python/python";

export enum Languages {
  typescript = "typescript",
  python = "python",
}

type CodegenByLanguageFn = (
  namespace: Namespace,
  language: Languages
) => string;

export const codegenByLanguage: CodegenByLanguageFn = (namespace, language) => {
  switch (language) {
    case Languages.typescript:
      return codegenTs(namespace);
    case Languages.python:
      return codegenPython(namespace);
    default:
      assertUnreachable(language);
      return "";
  }
};
