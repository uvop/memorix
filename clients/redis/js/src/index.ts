export { MemorixBase } from "./MemorixBase.ts";

declare const process: { env: { [key: string]: string | undefined } };

export const getEnvVariable = (name: string): string => {
  let value: string | undefined;

  if (typeof Deno !== "undefined") {
    value = Deno.env.get(name);
  } else if (typeof process !== "undefined" && process.env) {
    value = process.env[name];
  }
  if (value === undefined) {
    throw new Error(`Environment variable ${name} is not set`);
  }

  return value;
};
