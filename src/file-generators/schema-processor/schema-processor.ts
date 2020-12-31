import _ from "lodash";
import { FlameSchema } from "./schema-types";
import { CollectionEntry } from "../types";
import { processSchemaCollection } from "./schema-processor-collection-utils";
import * as path from "./schema-field-utils/schema-path-utils";

export function colEntryOfSchema(schema: FlameSchema): CollectionEntry[] {
  const schemaColMap = schema.collections;
  if (schema.authentication) {
    const auth = schema.authentication;
    const authUserCol = auth.userCollection;
    schema.collections[authUserCol].fields[auth.uidField] = { type: "string" };
    _(schemaColMap).forEach((col, colName) => {
      const colOwnerField = col.ownerField;
      if (colOwnerField) {
        if (col.fields[colOwnerField]) {
          const oldField = schema.collections[colName].fields[colOwnerField];
          const newField = oldField as path.PathSchemaField;
          newField.collection = authUserCol;
          schema.collections[colName].fields[colOwnerField] = newField;
        } else {
          const newField = {
            type: "path",
            collection: authUserCol,
          } as path.PathSchemaField;
          schema.collections[colName].fields[colOwnerField] = newField;
        }
      }
    });
  }
  const colEntries: CollectionEntry[] = _(schema.collections)
    .map(function (schemaCol, colName) {
      const col = processSchemaCollection(schemaCol, schemaColMap);
      return { colName, col };
    })
    .value();
  return colEntries;
}
