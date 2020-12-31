// import chain instead of default import _ to be compatible with
// ts-json-schema-generator
import { chain } from "lodash";
import { SchemaCollection, SchemaField } from "../schema-types";
import { ArrayOr, ImageMetadata } from "../../../types";
import { ImageField } from "../../types";
import { getSchemaFieldProperties } from "../schema-processor-utils";

export type ImageSchemaField = {
  type: "image";
  metadata?: ArrayOr<ImageMetadata>;
};
export function process(
  field: ImageSchemaField,
  data: { fName: string; col: SchemaCollection }
): ImageField {
  const properties = getSchemaFieldProperties({ field, ...data });
  const metadatas = chain([field.metadata]).compact().flatMap().value();
  return { ...field, ...properties, metadatas };
}
export function isTypeOf(field: SchemaField): field is ImageSchemaField {
  return (field as ImageSchemaField).type === "image";
}
