import { codegenByLanguage, Languages } from "./languages";

type CodegenFn = (params: { schema: string; language: Languages }) => string;

export const codegen: CodegenFn = ({ schema, language }) => {
  return codegenByLanguage(schema, language);
};
