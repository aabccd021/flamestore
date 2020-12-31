import { SchemaCollection, SchemaField } from "../schema-types";
import { ComputedField } from "../../types";
import { getSchemaFieldProperties } from "../schema-processor-utils";

export type ComputedSchemaField = {
  compute: "int" | "float" | "string" | "timestamp" | "path";
};

export function isTypeOf(field: SchemaField): field is ComputedSchemaField {
  return (field as ComputedSchemaField).compute !== undefined;
}

export function process(
  field: ComputedSchemaField,
  data: { fName: string; col: SchemaCollection }
): ComputedField {
  const properties = getSchemaFieldProperties({ field, ...data });
  const computedFieldType = field.compute;
  return { ...properties, ...field, type: "computed", computedFieldType };
}
