import pluralize from "pluralize";
import * as prettier from "prettier";
import * as fs from "fs";
import {
  FlamestoreSchema,
  FieldTypes,
  Field,
  Computed,
  StringField,
  ReferenceField,
  FloatField,
  SumField,
  CountField,
  DatetimeField,
  IntField,
  DynamicLinkField,
  ProjectConfiguration,
  DynamicLinkAttribute,
  DynamicLinkAttributeFromField,
  NonComputed,
  SpecialField,
} from "../type";

export function assertCollectionNameExists(
  collectionName: string,
  schema: FlamestoreSchema,
  stackTrace: string
): void {
  if (!Object.keys(schema.collections).includes(collectionName)) {
    throw Error(
      `Invalid Collection: ${stackTrace} provided collection with name ${collectionName} which doesn't exist`
    );
  }
}

function assertFieldExists(
  collectionName: string,
  fieldName: string,
  schema: FlamestoreSchema,
  stackTrace: string
) {
  assertCollectionNameExists(collectionName, schema, stackTrace);
  if (
    !Object.keys(schema.collections[collectionName].fields).includes(fieldName)
  ) {
    throw Error(
      `${stackTrace} provided field with name ${fieldName} in collection ${collectionName} when the field doesn't exist.`
    );
  }
}

function throwFieldTypeError(
  fieldType: FieldTypes,
  collectionName: string,
  fieldName: string,
  schema: FlamestoreSchema,
  stackTrace: string
) {
  throw Error(
    `collections.${collectionName}.${fieldName} must be type of ${fieldType} as required in ${stackTrace}.`
  );
}

export function assertFieldHasTypeOf(
  collectionName: string,
  fieldName: string,
  fieldType: FieldTypes,
  schema: FlamestoreSchema,
  stackTrace: string
): void {
  assertFieldExists(collectionName, fieldName, schema, stackTrace);
  const field = schema.collections[collectionName].fields[fieldName];
  if (!field) {
    throw Error(`'type' field is required in ${stackTrace}.`);
  }

  const type = schema.collections[collectionName].fields[fieldName];
  if (fieldType === FieldTypes.INT && !isTypeInt(type)) {
    throwFieldTypeError(
      FieldTypes.INT,
      collectionName,
      fieldName,
      schema,
      stackTrace
    );
  }
  if (fieldType === FieldTypes.STRING && !isTypeString(type)) {
    throwFieldTypeError(
      FieldTypes.STRING,
      collectionName,
      fieldName,
      schema,
      stackTrace
    );
  }
  if (fieldType === FieldTypes.PATH && !isTypeReference(type)) {
    throwFieldTypeError(
      FieldTypes.PATH,
      collectionName,
      fieldName,
      schema,
      stackTrace
    );
  }
  if (fieldType === FieldTypes.DATETIME && !isTypeDatetime(type)) {
    throwFieldTypeError(
      FieldTypes.DATETIME,
      collectionName,
      fieldName,
      schema,
      stackTrace
    );
  }
}

export function isTypeDynamicLink(field: Field): field is DynamicLinkField {
  return Object.prototype.hasOwnProperty.call(field, "dynamicLink");
}
export function isTypeString(field: Field): field is StringField {
  return Object.prototype.hasOwnProperty.call(field, "string");
}
export function isTypeFloat(field: Field): field is FloatField {
  return Object.prototype.hasOwnProperty.call(field, "float");
}
export function isTypeReference(field: Field): field is ReferenceField {
  return Object.prototype.hasOwnProperty.call(field, "path");
}
export function isTypeInt(field: Field): field is IntField {
  return Object.prototype.hasOwnProperty.call(field, "int");
}
export function isTypeDatetime(field: Field): field is DatetimeField {
  return Object.prototype.hasOwnProperty.call(field, "timestamp");
}
export function isTypeSum(field: Field): field is SumField {
  return Object.prototype.hasOwnProperty.call(field, "sum");
}
export function isTypeCount(field: Field): field is CountField {
  return Object.prototype.hasOwnProperty.call(field, "count");
}

function hasComputedProperty(field: Field): field is Computed {
  return Object.prototype.hasOwnProperty.call(field, "isComputed");
}

export function isSpecialField(field: Field): field is SpecialField {
  return field === "serverTimestamp";
}

function hasNonComputedProperty(field: Field): field is NonComputed {
  return !(hasComputedProperty(field) || isSpecialField(field));
}

export function isComputed(field?: Field): boolean | undefined {
  if (!field || !hasComputedProperty(field)) {
    return undefined;
  }
  return field.isComputed;
}

export function isOptional(field?: Field): boolean | undefined {
  return field && hasNonComputedProperty(field) ? field?.isOptional : undefined;
}

export function isUpdatable(field?: Field): boolean | undefined {
  return field && hasNonComputedProperty(field)
    ? field?.isUpdatable
    : undefined;
}

export function isCreatable(field?: Field): boolean | undefined {
  return field && hasNonComputedProperty(field)
    ? field?.isCreatable
    : undefined;
}

export function isUnique(field?: Field): boolean | undefined {
  return field && hasNonComputedProperty(field) ? field?.isUnique : undefined;
}

export function getDynamicLinkDomain(
  projectName: string,
  project: ProjectConfiguration
): string {
  if (project.dynamicLinkDomain) {
    return `${project.dynamicLinkDomain}`;
  }
  const projectDomain = project.domain ?? `${projectName}.web.app`;
  return `${projectDomain}/links`;
}

export function isDynamicLinkAttributeFromField(
  value?: DynamicLinkAttribute
): value is DynamicLinkAttributeFromField {
  return (
    value !== undefined && Object.prototype.hasOwnProperty.call(value, "field")
  );
}

export function getPascalCollectionName(collectionName: string): string {
  const singularized = pluralize.singular(collectionName);
  return singularized[0].toUpperCase() + singularized.substring(1);
}

export function writePrettyFile(fileName: string, content: string): void {
  const prettyContent = prettier.format(content, { parser: "typescript" });
  fs.writeFileSync(fileName, prettyContent);
}
