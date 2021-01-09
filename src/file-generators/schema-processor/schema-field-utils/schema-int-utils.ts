import {
  FlameSchemaAuth,
  SchemaCollection,
  SchemaField,
} from "../schema-types";
import { IntField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";

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
  data: {
    fName: string;
    schemaCol: SchemaCollection;
    colName: string;
    auth?: FlameSchemaAuth;
  }
): IntField {
  const properties = getSchemaFieldProperties({ field, ...data });
  return { ...field, ...properties };
}
