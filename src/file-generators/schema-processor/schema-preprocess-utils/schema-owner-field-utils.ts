import { PathSchemaField } from "../schema-field-utils/schema-path-utils";
import { SchemaField } from "../schema-types";

export function getOwnerField(param: {
  fields: { [name: string]: SchemaField };
  ownerFName: string;
  authColName: string;
}): PathSchemaField {
  const { fields, ownerFName, authColName } = param;
  const ownerField = fields[ownerFName];
  if (ownerField) {
    const newField = ownerField as PathSchemaField;
    newField.collection = authColName;
    return newField;
  }
  return { type: "path", collection: authColName };
}
