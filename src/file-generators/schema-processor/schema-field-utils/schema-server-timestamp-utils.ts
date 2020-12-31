import { SchemaCollection, SchemaField } from "../schema-types";
import { ServerTimestampField } from "../../types";
import { getSchemaFieldProperties } from "../schema-processor-utils";

export type ServerTimestampSchemaField = "serverTimestamp";

export function isTypeOf(
  field: SchemaField
): field is ServerTimestampSchemaField {
  return (field as ServerTimestampSchemaField) === "serverTimestamp";
}

export function toProcessed(
  field: ServerTimestampSchemaField,
  data: { fName: string; col: SchemaCollection }
): ServerTimestampField {
  const properties = getSchemaFieldProperties({ field, ...data });
  return { ...properties, type: "serverTimestamp" };
}
