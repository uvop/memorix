/* tslint-disable */
/* eslint-disable */
// @ts-nocheck

      export interface IntrospectionResultData {
        __schema: {
          types: {
            kind: string;
            name: string;
            possibleTypes: {
              name: string;
            }[];
          }[];
        };
      }
      const result: IntrospectionResultData = {
  "__schema": {
    "types": [
      {
        "kind": "UNION",
        "name": "PropertyValue",
        "possibleTypes": [
          {
            "name": "SchemaValue"
          },
          {
            "name": "SchemaObject"
          }
        ]
      }
    ]
  }
};
      export default result;
    