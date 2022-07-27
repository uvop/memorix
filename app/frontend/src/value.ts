export enum ValueTypes {
  simple,
  object,
  array,
}

export type ValueType = {
  isOptional: boolean;
} & (
  | {
      type: ValueTypes.simple;
      name: string;
    }
  | {
      type: ValueTypes.object;
      properties: PropertyType[];
    }
  | {
      type: ValueTypes.array;
      value: ValueType;
    }
);

export type PropertyType = {
  name: string;
  value: ValueType;
};
