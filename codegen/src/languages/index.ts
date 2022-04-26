import { assertUnreachable } from "src/utilities";
import { scopeToTs } from "./ts";

export enum Languages {
  typescript,
}

type ScopeToLanguageFn = (scope: string, language: Languages) => string;

export const scopeToLanguage: ScopeToLanguageFn = (scope, language) => {
  switch (language) {
    case Languages.typescript:
      return scopeToTs(scope);
    default:
      assertUnreachable(language);
  }
};
