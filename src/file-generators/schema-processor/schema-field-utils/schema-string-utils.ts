import { SchemaCollection, SchemaField } from "../schema-types";
import { StringField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";

export type StringSchemaField = {
  type: "string";
  minLength?: number;
  maxLength?: number;
};

export function isTypeOf(field: SchemaField): field is StringSchemaField {
  return (field as StringSchemaField).type === "string";
}

export function process(
  field: StringSchemaField,
  data: { fName: string; schemaCol: SchemaCollection }
): StringField {
  const { schemaCol, fName } = data;
  const properties = getSchemaFieldProperties({ field, ...data });
  const keyFields = schemaCol.keyFields ?? [];
  const isKeyField = keyFields.includes(fName);
  return { ...field, ...properties, isKeyField };
}
