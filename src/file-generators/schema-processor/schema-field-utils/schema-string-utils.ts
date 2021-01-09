import {
  FlameSchemaAuth,
  SchemaCollection,
  SchemaField,
} from "../schema-types";
import { StringField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";

export type StringSchemaField = {
  type: "string";
  minLength?: number;
  maxLength?: number;
};

export function isTypeOf(field: SchemaField): field is StringSchemaField {
  return (field as StringSchemaField).type === "string";
}

export function process(
  field: StringSchemaField,
  data: {
    fName: string;
    schemaCol: SchemaCollection;
    colName: string;
    auth?: FlameSchemaAuth;
  }
): StringField {
  const properties = getSchemaFieldProperties({ field, ...data });
  return { ...field, ...properties };
}
