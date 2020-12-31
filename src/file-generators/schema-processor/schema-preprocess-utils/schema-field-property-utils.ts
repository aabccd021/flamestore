import { FieldProperty } from "../../generator-types";
import { SchemaField, SchemaCollection } from "../schema-types";
import { hasFieldProperty } from "./schema-normal-field-property-utils";

export function getSchemaFieldProperties(param: {
  fName: string;
  field: SchemaField;
  col: SchemaCollection;
}): FieldProperty {
  const { fName, field, col } = param;
  const isOptional = hasFieldProperty(field, "isOptional");
  const isUnique = hasFieldProperty(field, "isUnique");
  const isCreatable = !hasFieldProperty(field, "isNotCreatable");
  const isUpdatable = !hasFieldProperty(field, "isNotUpdatable");
  const keyFields = col.keyFields ?? [];
  const isKeyField = keyFields.includes(fName);
  return { isOptional, isUpdatable, isUnique, isCreatable, isKeyField };
}
