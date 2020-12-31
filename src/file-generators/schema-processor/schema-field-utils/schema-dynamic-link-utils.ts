import { SchemaCollection, SchemaField } from "../schema-types";
import { DynamicLinkAttribute, DynamicLinkField } from "../../generator-types";
import { getSchemaFieldProperties } from "../schema-preprocess-utils/schema-field-property-utils";

export type DynamicLinkSchemaField = {
  type: "dynamicLink";
  title?: SchemaDynamicLinkAttribute;
  description?: SchemaDynamicLinkAttribute;
  imageURL?: SchemaDynamicLinkAttribute;
  isSuffixShort?: boolean;
};

export function toDynamicLinkAttribute(
  attribute?: SchemaDynamicLinkAttribute
): DynamicLinkAttribute | undefined {
  if (!attribute) return undefined;
  if (isDynamicLinkAttributeFromField(attribute)) {
    return { content: attribute.field, isLiteral: false };
  }
  return { content: attribute, isLiteral: true };
}

export function process(
  field: DynamicLinkSchemaField,
  data: { fName: string; col: SchemaCollection }
): DynamicLinkField {
  const properties = getSchemaFieldProperties({ field, ...data });
  const [title, description, imageURL] = [
    field.title,
    field.description,
    field.imageURL,
  ].map(toDynamicLinkAttribute);
  return { ...field, ...properties, title, description, imageURL };
}
export function isTypeOf(field: SchemaField): field is DynamicLinkSchemaField {
  return (field as DynamicLinkSchemaField).type === "dynamicLink";
}

type SchemaDynamicLinkAttribute = string | DynamicLinkAttributeFromField;
type DynamicLinkAttributeFromField = { field: string };
function isDynamicLinkAttributeFromField(
  value?: SchemaDynamicLinkAttribute
): value is DynamicLinkAttributeFromField {
  return (
    value !== undefined && Object.prototype.hasOwnProperty.call(value, "field")
  );
}
