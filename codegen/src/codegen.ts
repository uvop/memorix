import { codegenByLanguage, Languages } from "./languages";

type CodegenFn = (params: { schema: string; language?: Languages }) => string;

export const codegen: CodegenFn = ({
  schema,
  language = Languages.typescript,
}) => {
  return codegenByLanguage(schema, language);
};
