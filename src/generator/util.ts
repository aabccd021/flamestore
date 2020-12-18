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
  RichCollectionIteration,
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
export function isNormalField(field: Field): field is NormalField {
  return (
    isTypeDynamicLink(field) ||
    isTypeString(field) ||
    isTypeFloat(field) ||
    isTypeReference(field) ||
    isTypeInt(field) ||
    isTypeDatetime(field) ||
    isTypeSum(field) ||
    isTypeCount(field)
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

export function pascalColName(collectionName: string): string {
  const singularized = pluralize.singular(collectionName);
  return singularized[0].toUpperCase() + singularized.substring(1);
}

export function getPascal(str: string): string {
  return str[0].toUpperCase() + str.substring(1);
}

export function fIterOf(colIter: CollectionIteration): FieldIteration[] {
  return _.map(colIter.col.fields, (field, fName) => ({
    field,
    fName,
    ...colIter,
  }));
}

export function colIterOf(schema: FlamestoreSchema): CollectionIteration[] {
  return _.map(schema.collections, (col, colName) => ({
    col,
    colName,
    schema,
  }));
}

export function richColIterOf(
  schema: FlamestoreSchema
): RichCollectionIteration[] {
  return _.map(schema.collections, function (col, colName) {
    const singular = pluralize.singular(colName);
    const pascal = pascalColName(colName);
    return {
      singular,
      pascal,
      col,
      colName,
      schema,
    };
  });
}

export function isFieldRequired(
  fIter: FieldIteration,
  modules: FlamestoreModule[]
) {
  const { field } = fIter;
  return !isFieldOptional(field) && isFieldCreatable(fIter, modules);
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

export function getSyncFields(
  field: ReferenceField,
  colIter: CollectionIteration
) {
  const referenceCol = colIter.schema.collections[field.collection];
  return field.syncField
    ? _.flatMap([field.syncField]).map((fName) => ({
        fName,
        field: referenceCol.fields[fName],
        ...colIter,
      }))
    : [];
}
