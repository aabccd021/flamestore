import {
  FlameSchemaAuth,
  SchemaCollection,
  SchemaField,
} from "../schema-types";
import { ComputedField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";

export type ComputedSchemaField = {
  compute: "int" | "float" | "string" | "timestamp";
};

export function isTypeOf(field: SchemaField): field is ComputedSchemaField {
  return (field as ComputedSchemaField).compute !== undefined;
}

export function process(
  field: ComputedSchemaField,
  data: {
    fName: string;
    schemaCol: SchemaCollection;
    colName: string;
    auth?: FlameSchemaAuth;
  }
): ComputedField {
  const properties = getSchemaFieldProperties({ field, ...data });
  const computedFieldType = field.compute;
  return { ...properties, ...field, type: "computed", computedFieldType };
}
