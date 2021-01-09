import { FieldProperty } from "../../generator-types";
import {
  SchemaField,
  SchemaCollection,
  FlameSchemaAuth,
} from "../schema-types";
import { hasFieldProperty } from "./schema-normal-field-property-utils";

export function getSchemaFieldProperties(param: {
  fName: string;
  field: SchemaField;
  schemaCol: SchemaCollection;
  colName: string;
  auth?: FlameSchemaAuth;
}): FieldProperty {
  const { field } = param;
  const isOptional = hasFieldProperty(field, "isOptional");
  const isUnique = hasFieldProperty(field, "isUnique");
  const isCreatable = !hasFieldProperty(field, "isNotCreatable");
  const isUpdatable = !hasFieldProperty(field, "isNotUpdatable");
  const isKeyField = getIsKeyField(param);
  return { isOptional, isUpdatable, isUnique, isCreatable, isKeyField };
}

function getIsKeyField(param: {
  fName: string;
  schemaCol: SchemaCollection;
  colName: string;
  auth?: FlameSchemaAuth;
}): boolean {
  const { fName, colName, schemaCol, auth } = param;
  const keyFields = schemaCol.keyFields ?? [];
  if (keyFields.includes(fName)) return true;
  if (auth) {
    const { uidField, userCollection } = auth;
    console.log(fName);
    if (userCollection === colName && uidField === fName) return true;
  }
  return false;
}
