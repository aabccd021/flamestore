import { SchemaCollection, SchemaField } from "../schema-types";
import { FloatField } from "../../types";
import { getSchemaFieldProperties } from "../schema-processor-utils";

export type FloatSchemaField = {
  type: "float";
  min?: number;
  max?: number;
  deleteDocWhen?: number;
};

export function process(
  field: FloatSchemaField,
  data: { fName: string; col: SchemaCollection }
): FloatField {
  const properties = getSchemaFieldProperties({ field, ...data });
  return { ...field, ...properties };
}

export function isTypeOf(field: SchemaField): field is FloatSchemaField {
  return (field as FloatSchemaField).type === "float";
}
