import pluralize from "pluralize";
import {
  FlamestoreSchema,
  FieldTypes,
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
  Field,
  FieldIteration,
  CollectionIteration,
  NormalField,
  ComputedField,
  ImageField,
  ImageMetadata,
} from "../type";
import _ from "lodash";
import { FlamestoreModule } from "./type";

export function assertCollectionNameExists(
  collectionName: string,
  schema: FlamestoreSchema,
  stackTrace: string
): void {
  if (!_.keys(schema.collections).includes(collectionName)) {
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
  if (!_.keys(schema.collections[collectionName].fields).includes(fieldName)) {
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
  if (fieldType === "int" && !isTypeInt(type)) {
    throwFieldTypeError("int", collectionName, fieldName, schema, stackTrace);
  }
  if (fieldType === "string" && !isTypeString(type)) {
    throwFieldTypeError(
      "string",
      collectionName,
      fieldName,
      schema,
      stackTrace
    );
  }
  if (fieldType === "path" && !isTypeReference(type)) {
    throwFieldTypeError("path", collectionName, fieldName, schema, stackTrace);
  }
  if (fieldType === "timestamp" && !isTypeDatetime(type)) {
    throwFieldTypeError(
      "timestamp",
      collectionName,
      fieldName,
      schema,
      stackTrace
    );
  }
}

export function isTypeDynamicLink(field: Field): field is DynamicLinkField {
  return (field as DynamicLinkField).type === "dynamicLink";
}
export function isTypeString(field: Field): field is StringField {
  return (field as StringField).type === "string";
}
export function isTypeFloat(field: Field): field is FloatField {
  return (field as FloatField).type === "float";
}
export function isTypeReference(field: Field): field is ReferenceField {
  return (field as ReferenceField).type === "path";
}
export function isTypeInt(field: Field): field is IntField {
  return (field as IntField).type === "int";
}
export function isTypeDatetime(field: Field): field is DatetimeField {
  return (field as DatetimeField).type === "timestamp";
}
export function isTypeSum(field: Field): field is SumField {
  return (field as SumField).type === "sum";
}
export function isTypeCount(field: Field): field is CountField {
  return (field as CountField).type === "count";
}
export function isTypeImage(field: Field): field is ImageField {
  return (field as ImageField).type === "image";
}
export function isNormalField(field: Field): field is NormalField {
  return (
    isTypeDynamicLink(field) ||
    isTypeString(field) ||
    isTypeFloat(field) ||
    isTypeReference(field) ||
    isTypeInt(field) ||
    isTypeDatetime(field) ||
    isTypeSum(field) ||
    isTypeCount(field) ||
    isTypeImage(field)
  );
}
export function isTypeComputed(field: Field): field is ComputedField {
  return (field as ComputedField).compute !== undefined;
}
export function isFieldComputed(field: Field): boolean {
  return isTypeComputed(field);
}
export function isFieldUnique(field: Field): boolean {
  return (
    isNormalField(field) &&
    !_.isNil(field.property) &&
    (field.property === "isUnique" || field.property.includes("isUnique"))
  );
}
export function isFieldOptional(field: Field): boolean {
  return (
    isNormalField(field) &&
    !_.isNil(field.property) &&
    (field.property === "isOptional" || field.property.includes("isOptional"))
  );
}
export function isFieldNotCreatable(field: Field): boolean {
  return (
    isNormalField(field) &&
    !_.isNil(field.property) &&
    (field.property === "isNotCreatable" ||
      field.property.includes("isNotCreatable"))
  );
}
export function isFieldNotUpdatable(field: Field): boolean {
  return (
    isNormalField(field) &&
    !_.isNil(field.property) &&
    (field.property === "isNotUpdatable" ||
      field.property.includes("isNotUpdatable"))
  );
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

export function fItersOf(colIter: CollectionIteration): FieldIteration[] {
  return _.map(colIter.col.fields, (field, fName) => {
    const pascalFName = toPascal(fName);
    return {
      pascalFName,
      field,
      fName,
      ...colIter,
    };
  });
}

export function colIterOf(
  colName: string,
  schema: FlamestoreSchema
): CollectionIteration {
  const col = schema.collections[colName];
  const singularColName = pluralize.singular(colName);
  const pascalColName =
    singularColName[0].toUpperCase() + singularColName.substring(1);
  return { col, colName, singularColName, pascalColName, schema };
}

export function colItersOf(schema: FlamestoreSchema): CollectionIteration[] {
  return _.keys(schema.collections).map((colName) =>
    colIterOf(colName, schema)
  );
}

export function isFieldRequired(
  fIter: FieldIteration,
  modules: FlamestoreModule[]
) {
  const { field } = fIter;
  return !isFieldOptional(field) && isFieldCreatable(fIter, modules);
}

export function isFlutterFieldRequired(
  fIter: FieldIteration,
  modules: FlamestoreModule[]
) {
  const { field } = fIter;
  return !isTypeDynamicLink(field) && isFieldRequired(fIter, modules);
}

export function isFieldCreatable(
  fIter: FieldIteration,
  modules: FlamestoreModule[]
) {
  return (
    _(modules)
      .map((module) => module.isCreatable)
      .compact()
      .some((isCreatable) => isCreatable(fIter)) &&
    !_(modules)
      .map((module) => module.isNotCreatable)
      .compact()
      .some((isNotCreatable) => isNotCreatable(fIter))
  );
}

export function isFieldUpdatable(
  fIter: FieldIteration,
  modules: FlamestoreModule[]
) {
  return (
    _(modules)
      .map((module) => module.isUpdatable)
      .compact()
      .some((isUpdatable) => isUpdatable(fIter)) &&
    !_(modules)
      .map((module) => module.isNotUpdatable)
      .compact()
      .some((isNotUpdatable) => isNotUpdatable(fIter))
  );
}
export function getSyncFields(
  field: ReferenceField,
  schema: FlamestoreSchema
): FieldIteration[] {
  if (!field.syncField) return [];
  const referenceCol = schema.collections[field.collection];
  return _.flatMap([field.syncField]).map((fName) => ({
    fName,
    pascalFName: toPascal(fName),
    field: referenceCol.fields[fName],
    ...colIterOf(field.collection, schema),
  }));
}

export function getImageMetadatas(field: ImageField): ImageMetadata[] {
  if (!field.metadata) return [];
  return _.flatMap([field.metadata]).map((x) => x);
}

export function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}
function toPascal(s: string): string {
  return s[0].toUpperCase() + s.substring(1);
}
