import { SchemaCollection, SchemaField } from "../schema-types";
import { IntField } from "../../types";
import { getSchemaFieldProperties } from "../schema-processor-utils";

export type SchemaIntField = {
  type: "int";
  min?: number;
  max?: number;
  deleteDocWhen?: number;
};
export function isTypeOf(field: SchemaField): field is SchemaIntField {
  return (field as SchemaIntField).type === "int";
}
export function process(
  field: SchemaIntField,
  data: { fName: string; col: SchemaCollection }
): IntField {
  const properties = getSchemaFieldProperties({ field, ...data });
  return { ...field, ...properties };
}
