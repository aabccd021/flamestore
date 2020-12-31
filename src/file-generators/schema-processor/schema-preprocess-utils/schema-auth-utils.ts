import _ from "lodash";
import { StringSchemaField } from "../schema-field-utils/schema-string-utils";
import { FlameSchemaAuth, SchemaCollection } from "../schema-types";
import { getOwnerField } from "./schema-owner-field-utils";

export function preprocessAuth(
  schemaMetadata: { authentication?: FlameSchemaAuth },
  schemaColMap: { [colName: string]: SchemaCollection }
): { [colName: string]: SchemaCollection } {
  const { authentication } = schemaMetadata;
  if (!authentication) return schemaColMap;
  const { userCollection: authColName, uidField } = authentication;
  // Create auth uid field to user collection
  const newAuthField = { type: "string" } as StringSchemaField;
  schemaColMap[authColName].fields[uidField] = newAuthField;
  // Create owner field for all collections
  _(schemaColMap).forEach((col, colName) => {
    const { ownerField: ownerFName, fields } = col;
    // Collection has owner
    if (ownerFName) {
      const newOwnerField = getOwnerField({ fields, ownerFName, authColName });
      schemaColMap[colName].fields[ownerFName] = newOwnerField;
    }
  });
  return schemaColMap;
}
