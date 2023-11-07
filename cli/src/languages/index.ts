import { assertUnreachable } from "src/core/utilities";
import { Namespace } from "src/core/namespace";
import { codegen as codegenTs } from "./ts/ts";
import { codegen as codegenPython } from "./python/python";
import { codegen as codegenRust } from "./rust/rust";

export enum Languages {
  typescript = "typescript",
  python = "python",
  rust = "rust",
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
    case Languages.rust:
      return codegenRust(namespace);
    default:
      assertUnreachable(language);
      return "";
  }
};
