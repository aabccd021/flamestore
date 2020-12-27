import { FlamestoreSchema, ReferenceField } from "../type";
import { colItersOf } from "./util";

export function preprocessSchema(schema: FlamestoreSchema): FlamestoreSchema {
  if (schema.authentication) {
    const auth = schema.authentication;
    schema.collections[auth.userCollection].fields[auth.uidField] = {
      type: "string",
    };
    colItersOf(schema).forEach(({ colName, col }) => {
      if (col.ownerField) {
        if (col.fields[col.ownerField]) {
          (schema.collections[colName].fields[
            col.ownerField
          ] as ReferenceField).collection = auth.userCollection;
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
