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
  data: { fName: string; col: SchemaCollection }
): StringField {
  const properties = getSchemaFieldProperties({ field, ...data });
  return { ...field, ...properties };
}
