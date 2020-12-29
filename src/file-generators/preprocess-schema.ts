import { FlamestoreSchema, PathField } from "../type";
import { colsOf } from "./utils";

export function preprocessSchema(schema: FlamestoreSchema): FlamestoreSchema {
  if (schema.authentication) {
    const auth = schema.authentication;
    schema.collections[auth.userCollection].fields[auth.uidField] = {
      type: "string",
    };
    colsOf(schema).forEach(({ colName, col }) => {
      if (col.ownerField) {
        if (col.fields[col.ownerField]) {
          (schema.collections[colName].fields[
            col.ownerField
          ] as PathField).collection = auth.userCollection;
        } else {
          schema.collections[colName].fields[col.ownerField] = {
            type: "path",
            collection: auth.userCollection,
          };
        }
      }
    });
  }
  return schema;
}
