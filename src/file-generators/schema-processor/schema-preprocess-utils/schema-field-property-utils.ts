import { FieldProperty } from "../../generator-types";
import { SchemaField, SchemaCollection } from "../schema-types";
import { hasFieldProperty } from "./schema-normal-field-property-utils";

export function getSchemaFieldProperties(param: {
  fName: string;
  field: SchemaField;
  schemaCol: SchemaCollection;
}): FieldProperty {
  const { field } = param;
  const isOptional = hasFieldProperty(field, "isOptional");
  const isUnique = hasFieldProperty(field, "isUnique");
  const isNotUpdatable = hasFieldProperty(field, "isNotUpdatable");
  return { isOptional, isNotUpdatable, isUnique };
}
