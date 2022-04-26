import { assertUnreachable } from "src/utilities";
import { codegenTs } from "./ts";

export enum Languages {
  typescript,
}

type CodegenByLanguageFn = (schema: string, language: Languages) => string;

export const codegenByLanguage: CodegenByLanguageFn = (scope, language) => {
  switch (language) {
    case Languages.typescript:
      return codegenTs(scope);
    default:
      assertUnreachable(language);
      return "";
  }
};
