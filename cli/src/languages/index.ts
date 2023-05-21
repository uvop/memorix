import { assertUnreachable } from "src/core/utilities";
import { Namespaces } from "src/core/block";
import { codegen as codegenTs } from "./ts/ts";
import { codegen as codegenPython } from "./python/python";

export enum Languages {
  typescript = "typescript",
  python = "python",
}

type CodegenByLanguageFn = (
  namespaces: Namespaces,
  language: Languages
) => string;

export const codegenByLanguage: CodegenByLanguageFn = (ns, language) => {
  switch (language) {
    case Languages.typescript:
      return codegenTs(ns);
    case Languages.python:
      return codegenPython(ns);
    default:
      assertUnreachable(language);
      return "";
  }
};
