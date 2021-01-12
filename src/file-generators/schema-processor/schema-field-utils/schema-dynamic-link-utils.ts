import {
  ProjectConfiguration,
  SchemaCollection,
  SchemaField,
} from "../schema-types";
import { map } from "lodash";
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
  data: {
    fName: string;
    schemaCol: SchemaCollection;
    projects: { [name: string]: ProjectConfiguration };
  }
): DynamicLinkField {
  const { projects } = data;
  const properties = getSchemaFieldProperties({ field, ...data });
  const isSuffixShort = field.isSuffixShort ?? false;
  const fieldAttrs = [field.title, field.description, field.imageURL];
  const [title, description, imageURL] = fieldAttrs.map(toDynamicLinkAttribute);
  const domains = map(projects, (project, pName) => {
    const domain = project.domain ?? `${pName}.web.app`;
    const dynamicLinkDomain = project.dynamicLinkDomain ?? `${domain}/links`;
    return `https://${dynamicLinkDomain}/`;
  });
  return {
    ...field,
    ...properties,
    title,
    description,
    imageURL,
    isSuffixShort,
    domains,
  };
}
export function isTypeOf(field: SchemaField): field is DynamicLinkSchemaField {
  return (field as DynamicLinkSchemaField).type === "dynamicLink";
}

type SchemaDynamicLinkAttribute = string | DynamicLinkAttributeFromField;
type DynamicLinkAttributeFromField = { field: string };
function isDynamicLinkAttributeFromField(
  value?: SchemaDynamicLinkAttribute
): value is DynamicLinkAttributeFromField {
  if (value === undefined) return false;
  if (!Object.prototype.hasOwnProperty.call(value, "field")) return false;
  return true;
}
