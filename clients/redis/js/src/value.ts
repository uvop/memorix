declare const process: { env: { [key: string]: string | undefined } };

export type Value = {
  type: "string" | "env";
  env?: {
    name: string;
    value: string | undefined;
  };
  string?: {
    value: string;
  };
};

export const requireValue = (value: Value) => {
  if (value.type === "string") {
    return value.string!.value;
  }
  if (value.env!.value === undefined) {
    throw new Error(`Environment variable "${value.env!.name}" is not set`);
  }
  return value.env!.value;
};

export const getStringValue = (value: string): Value => {
  return { type: "string", string: { value } };
};

export const getEnvVariableValue = (name: string): Value => {
  let value: string | undefined;

  if (typeof Deno !== "undefined") {
    value = Deno.env.get(name);
  } else if (typeof process !== "undefined" && process.env) {
    value = process.env[name];
  }

  return { type: "env", env: { name, value } };
};
