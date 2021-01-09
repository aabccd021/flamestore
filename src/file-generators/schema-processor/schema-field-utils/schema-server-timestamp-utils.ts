import {
  FlameSchemaAuth,
  SchemaCollection,
  SchemaField,
} from "../schema-types";
import { ServerTimestampField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";

export type ServerTimestampSchemaField = "serverTimestamp";

export function isTypeOf(
  field: SchemaField
): field is ServerTimestampSchemaField {
  return (field as ServerTimestampSchemaField) === "serverTimestamp";
}

export function toProcessed(
  field: ServerTimestampSchemaField,
  data: {
    fName: string;
    schemaCol: SchemaCollection;
    colName: string;
    auth?: FlameSchemaAuth;
  }
): ServerTimestampField {
  const properties = getSchemaFieldProperties({ field, ...data });
  return { ...properties, type: "serverTimestamp" };
}
