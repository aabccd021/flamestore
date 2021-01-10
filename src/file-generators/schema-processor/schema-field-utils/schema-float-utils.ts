import { SchemaCollection, SchemaField } from "../schema-types";
import { FloatField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";

export type FloatSchemaField = {
  type: "float";
  min?: number;
  max?: number;
  deleteDocWhen?: number;
};

export function process(
  field: FloatSchemaField,
  data: {
    fName: string;
    schemaCol: SchemaCollection;
  }
): FloatField {
  const properties = getSchemaFieldProperties({ field, ...data });
  return { ...field, ...properties };
}

export function isTypeOf(field: SchemaField): field is FloatSchemaField {
  return (field as FloatSchemaField).type === "float";
}
