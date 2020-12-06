import pluralize from 'pluralize';
import { FlamestoreSchema, FieldTypes, Field, FieldProperty, Computed, StringField, ReferenceField, FieldType, FloatField, SumField, CountField, SyncFromField, DatetimeField, IntField, DynamicLinkField, ProjectConfiguration, DynamicLinkAttribute, DynamicLinkAttributeFromField } from '../type';

export function assertCollectionNameExists(collectionName: string, schema: FlamestoreSchema, stackTrace: string) {
  if (!Object.keys(schema.collections).includes(collectionName)) {
    throw Error(
      `Invalid Collection: ${stackTrace} provided collection with name ${collectionName} which doesn't exist`
    );
  };
}

function assertFieldExists(collectionName: string, fieldName: string, schema: FlamestoreSchema, stackTrace: string) {
  assertCollectionNameExists(collectionName, schema, stackTrace);
  if (!Object.keys(schema.collections[collectionName].fields).includes(fieldName)) {
    throw Error(
      `${stackTrace} provided field with name ${fieldName} in collection ${collectionName} when the field doesn't exist.`
    );
  }
}

function throwFieldTypeError(
  fieldType: FieldTypes, collectionName: string, fieldName: string, schema: FlamestoreSchema, stackTrace: string
) {
  throw Error(`collections.${collectionName}.${fieldName} must be type of ${fieldType} as required in ${stackTrace}.`)
}

export function assertFieldHasTypeOf(
  collectionName: string, fieldName: string, fieldType: FieldTypes, schema: FlamestoreSchema, stackTrace: string
) {
  assertFieldExists(collectionName, fieldName, schema, stackTrace);
  const field = schema.collections[collectionName].fields[fieldName];
  if (!field.type) {
    throw Error(`'type' field is required in ${stackTrace}.`)
  }

  const type = schema.collections[collectionName].fields[fieldName].type;
  if (fieldType === FieldTypes.INT && !isTypeInt(type)) {
    throwFieldTypeError(FieldTypes.INT, collectionName, fieldName, schema, stackTrace);
  }
  if (fieldType === FieldTypes.STRING && !isTypeString(type)) {
    throwFieldTypeError(FieldTypes.STRING, collectionName, fieldName, schema, stackTrace);
  }
  if (fieldType === FieldTypes.PATH && !isTypeReference(type)) {
    throwFieldTypeError(FieldTypes.PATH, collectionName, fieldName, schema, stackTrace);
  }
  if (fieldType === FieldTypes.DATETIME && !isTypeDatetime(type)) {
    throwFieldTypeError(FieldTypes.DATETIME, collectionName, fieldName, schema, stackTrace);
  }
}

export function getColNameToSyncFrom(collectionName: string, fieldName: string, schema: FlamestoreSchema) {
  const collection = schema.collections[collectionName];
  const field = collection.fields[fieldName];
  const stackTrace = `collections.${collectionName}.${fieldName}.syncFrom`;
  const fieldType = field.type;
  if (isTypeSyncFrom(fieldType)) {
    const referenceFieldName = fieldType.syncFrom.reference;
    assertFieldHasTypeOf(
      collectionName, referenceFieldName, FieldTypes.PATH, schema, `${stackTrace}.reference`
    )
    const referenceType = collection.fields[referenceFieldName].type;
    if (isTypeReference(referenceType)) {
      const collectionNameToSyncFrom = referenceType.path.collection;
      assertFieldExists(collectionNameToSyncFrom, fieldType.syncFrom.field, schema, `${stackTrace}.field`)
      return collectionNameToSyncFrom;
    }
  }
  throw Error('Not an syncFrom field');
}

export function isTypeDynamicLink(value: FieldType): value is DynamicLinkField {
  return value.hasOwnProperty('dynamicLink');
}
export function isTypeString(value: FieldType): value is StringField {
  return value.hasOwnProperty('string');
}
export function isTypeFloat(value: FieldType): value is FloatField {
  return value.hasOwnProperty('float');
}
export function isTypeReference(value: FieldType): value is ReferenceField {
  return value.hasOwnProperty('path');
}
export function isTypeInt(value: FieldType): value is IntField {
  return value.hasOwnProperty('int');
}
export function isTypeDatetime(value: FieldType): value is DatetimeField {
  return value.hasOwnProperty('timestamp');
}
export function isTypeSum(value: FieldType): value is SumField {
  return value.hasOwnProperty('sum');
}
export function isTypeCount(value: FieldType): value is CountField {
  return value.hasOwnProperty('count');
}
export function isTypeSyncFrom(value: FieldType): value is SyncFromField {
  return value.hasOwnProperty('syncFrom');
}

export function getFieldType(
  type: FieldType,
  fieldName: string,
  collectionName: string,
  schema: FlamestoreSchema
): FieldTypes {
  if (isTypeString(type)) {
    return FieldTypes.STRING;
  }
  if (isTypeFloat(type)) {
    return FieldTypes.FLOAT;
  }
  if (isTypeReference(type)) {
    return FieldTypes.PATH;
  }
  if (isTypeInt(type)) {
    return FieldTypes.INT;
  }
  if (isTypeDatetime(type)) {
    return FieldTypes.DATETIME;
  }
  if (isTypeSum(type)) {
    return FieldTypes.FLOAT;
  }
  if (isTypeCount(type)) {
    return FieldTypes.INT;
  }
  if (isTypeDynamicLink(type)) {
    return FieldTypes.STRING;
  }
  if (isTypeSyncFrom(type)) {
    const colNameToSyncFrom = getColNameToSyncFrom(collectionName, fieldName, schema);
    const atype = schema.collections[colNameToSyncFrom].fields[type.syncFrom.field].type;
    return getFieldType(atype, fieldName, collectionName, schema);
  }
  throw Error();
}

export function getPascalCollectionName(collectionName: string): string {
  const singularized = pluralize.singular(collectionName);
  return singularized[0].toUpperCase() + singularized.substring(1);
}

function isComputedProperty(value: FieldProperty): value is Computed {
  return value.hasOwnProperty('isComputed');
}

export function isComputed(field?: Field): boolean | undefined {
  const property = field?.property;
  if (!property || !isComputedProperty(property)) {
    return undefined;
  }
  return property.isComputed;
}

export function isOptional(field?: Field): boolean | undefined {
  const property = field?.property;
  if (!property || isComputedProperty(property)) {
    return undefined;
  }
  return property?.isOptional;
}

export function isUpdatable(field?: Field): boolean | undefined {
  const property = field?.property;
  if (!property || isComputedProperty(property)) {
    return undefined;
  }
  return property?.rules?.isUpdatable;
}

export function isCreatable(field?: Field): boolean | undefined {
  const property = field?.property;
  if (!property || isComputedProperty(property)) {
    return undefined;
  }
  return property?.rules?.isCreatable;
}

export function isUnique(field?: Field): boolean | undefined {
  const property = field?.property;
  if (!property || isComputedProperty(property)) {
    return false;
  }
  return property?.isUnique
}

export function getDynamicLinkDomain(projectName: string, project: ProjectConfiguration): string {
  if (project.dynamicLinkDomain) {
    return `${project.dynamicLinkDomain}`;
  }
  const projectDomain = project.domain ?? `${projectName}.web.app`;
  return `${projectDomain}/links`
}

export function isDynamicLinkAttributeFromField(value?: DynamicLinkAttribute): value is DynamicLinkAttributeFromField {
  return value != null && value.hasOwnProperty('field');
}