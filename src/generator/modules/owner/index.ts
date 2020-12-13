import { ReferenceField } from "../../../type";
import { FlamestoreModule } from "../../type";
import { colIterOf } from "../../util";

export const module: FlamestoreModule = {
  preprocessSchema: (schema) => {
    if (schema.authentication) {
      const auth = schema.authentication;
      schema.collections[auth.userCollection].fields[auth.uidField] = {
        type: "string",
      };
      colIterOf(schema).forEach(({ colName, col }) => {
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
  },
};
