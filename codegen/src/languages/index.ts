import { assertUnreachable } from "src/utilities";
import { codegenTs } from "./ts";
import { codegenPython } from "./python";

export enum Languages {
  typescript,
  python,
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
