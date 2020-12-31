import { SchemaCollection, SchemaField } from "../schema-types";
import { CountField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";

export type CountSchemaField = {
  type: "count";
  collection: string;
  reference: string;
};

export function isTypeOf(field: SchemaField): field is CountSchemaField {
  return (field as CountSchemaField).type === "count";
}

export function process(
  field: CountSchemaField,
  data: { fName: string; col: SchemaCollection }
): CountField {
  const properties = getSchemaFieldProperties({ field, ...data });
  const colName = field.collection;
  const refName = field.reference;
  return { ...field, ...properties, colName, refName };
}
