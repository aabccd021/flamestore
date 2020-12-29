import pluralize from "pluralize";
import {
  FlameSchema,
  FieldTypes,
  StringField,
  PathField,
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
  ArrayOr,
} from "../type";
import _ from "lodash";

export function assertCollectionNameExists(
  collectionName: string,
  schema: FlameSchema,
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
  schema: FlameSchema,
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
  schema: FlameSchema,
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
  schema: FlameSchema,
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
  if (fieldType === "path" && !isTypePath(type)) {
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
export function isTypePath(field: Field): field is PathField {
  return (field as PathField).type === "path";
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
    isTypePath(field) ||
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

export function fieldsOfSchema(
  schema: FlameSchema
): _.Collection<FieldIteration> {
  return colsOf(schema)
    .map((colIter) => fieldsOfCol(colIter).value())
    .flatMap();
}

export function fieldsOfCol(
  colIter: CollectionIteration
): _.Collection<FieldIteration> {
  return _(colIter.col.fields).map((field, fName) => {
    return { field, fName, ...colIter };
  });
}

export function colsOf(schema: FlameSchema): _.Collection<CollectionIteration> {
  return _(schema.collections).map((col, colName) => ({ col, colName }));
}

export function getSyncFields(
  field: PathField,
  schema: FlameSchema
): FieldIteration[] {
  if (!field.syncField) return [];
  const colName = field.collection;
  const col = schema.collections[colName];
  return _([field.syncField])
    .flatMap()
    .map((fName) => ({ fName, field: col.fields[fName], col, colName }))
    .value();
}

export function getImageMetadatas(field: ImageField): ImageMetadata[] {
  if (!field.metadata) return [];
  return _([field.metadata]).flatMap().value();
}

export function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

export function flatten<T>(array: ArrayOr<T>) {
  return _([array]).flatMap().value();
}

export function mapPick<T, V extends keyof T>(
  array: _.Collection<T> | T[],
  key: V
): _.Collection<T[V]> {
  return _(array).map(key);
}

export function toSingularColName(colName: string): string {
  return pluralize.singular(colName);
}
export function toPascalColName(colName: string): string {
  return _.upperFirst(toSingularColName(colName));
}
