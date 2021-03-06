import { SchemaCollection, SchemaField } from "../schema-types";
import { SumField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";

export type SumSchemaField = {
  type: "sum";
  collection: string;
  field: string;
  reference: string;
};

export function process(
  field: SumSchemaField,
  data: { fName: string; schemaCol: SchemaCollection }
): SumField {
  const properties = getSchemaFieldProperties({ field, ...data });
  const colName = field.collection;
  const incFieldName = field.field;
  const refName = field.reference;
  return { ...field, ...properties, colName, incFieldName, refName };
}

export function isTypeOf(field: SchemaField): field is SumSchemaField {
  return (field as SumSchemaField).type === "sum";
}
