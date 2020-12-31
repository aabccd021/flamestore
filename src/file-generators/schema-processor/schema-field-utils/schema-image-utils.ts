// import chain instead of default import _ to be compatible with
// ts-json-schema-generator
import { chain } from "lodash";
import { SchemaCollection, SchemaField } from "../schema-types";
import { ImageField, ImageMetadata } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";
import { ArrayOr } from "../../../types";

export type ImageSchemaField = {
  type: "image";
  metadata?: ArrayOr<ImageMetadata>;
};

export function process(
  field: ImageSchemaField,
  data: { fName: string; schemaCol: SchemaCollection }
): ImageField {
  const properties = getSchemaFieldProperties({ field, ...data });
  const metadatas = chain([field.metadata]).compact().flatMap().value();
  return { ...field, ...properties, metadatas };
}

export function isTypeOf(field: SchemaField): field is ImageSchemaField {
  return (field as ImageSchemaField).type === "image";
}
