import pluralize from 'pluralize';
import * as prettier from 'prettier';
import * as fs from 'fs';
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
  NonComputed
} from '../type';

export function assertCollectionNameExists(collectionName: string, schema: FlamestoreSchema, stackTrace: string) {
  if (!Object.keys(schema.collections).includes(collectionName)) {
    throw Error(
      `Invalid Collection: ${stackTrace} provided collection with name ${collectionName} which doesn't exist`
    );
  }
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
  throw Error(`collections.${collectionName}.${fieldName} must be type of ${fieldType} as required in ${stackTrace}.`);
}

export function assertFieldHasTypeOf(
  collectionName: string, fieldName: string, fieldType: FieldTypes, schema: FlamestoreSchema, stackTrace: string
) {
  assertFieldExists(collectionName, fieldName, schema, stackTrace);
  const field = schema.collections[collectionName].fields[fieldName];
  if (!field) {
    throw Error(`'type' field is required in ${stackTrace}.`);
  }

  const type = schema.collections[collectionName].fields[fieldName];
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

// export function getColNameToSyncFrom(collectionName: string, fieldName: string, schema: FlamestoreSchema) {
//   const collection = schema.collections[collectionName];
//   const field = collection.fields[fieldName];
//   const stackTrace = `collections.${collectionName}.${fieldName}.syncFrom`;
//   const fieldType = field;
//   if (isTypeSyncFrom(fieldType)) {
//     const referenceFieldName = fieldType.syncFrom.reference;
//     assertFieldHasTypeOf(
//       collectionName, referenceFieldName, FieldTypes.PATH, schema, `${stackTrace}.reference`
//     )
//     const referenceType = collection.fields[referenceFieldName];
//     if (isTypeReference(referenceType)) {
//       const collectionNameToSyncFrom = referenceType.path.collection;
//       assertFieldExists(collectionNameToSyncFrom, fieldType.syncFrom.field, schema, `${stackTrace}.field`)
//       return collectionNameToSyncFrom;
//     }
//   }
//   throw Error('Not an syncFrom field');
// }

export function isTypeDynamicLink(field: Field): field is DynamicLinkField {
  return field.hasOwnProperty('dynamicLink');
}
export function isTypeString(field: Field): field is StringField {
  return field.hasOwnProperty('string');
}
export function isTypeFloat(field: Field): field is FloatField {
  return field.hasOwnProperty('float');
}
export function isTypeReference(field: Field): field is ReferenceField {
  return field.hasOwnProperty('path');
}
export function isTypeInt(field: Field): field is IntField {
  return field.hasOwnProperty('int');
}
export function isTypeDatetime(field: Field): field is DatetimeField {
  return field.hasOwnProperty('timestamp');
}
export function isTypeSum(field: Field): field is SumField {
  return field.hasOwnProperty('sum');
}
export function isTypeCount(field: Field): field is CountField {
  return field.hasOwnProperty('count');
}

export function hasComputedField(field: Field): field is Computed {
  return true;
}

function hasComputedProperty(field: Field): field is Computed {
  return field.hasOwnProperty('isComputed');
}

function hasNonComputedProperty(field: Field): field is NonComputed {
  return !(hasComputedProperty(field) || field === 'serverTimestamp');
}

export function isComputed(field?: Field): boolean | undefined {
  if (!field || !hasComputedProperty(field)) {
    return undefined;
  }
  return field.isComputed;
}

export function isOptional(field?: Field): boolean | undefined {
  return (field && hasNonComputedProperty(field)) ? field?.isOptional : undefined;
}

export function isUpdatable(field?: Field): boolean | undefined {
  return (field && hasNonComputedProperty(field)) ? field?.isUpdatable : undefined;
}

export function isCreatable(field?: Field): boolean | undefined {
  return (field && hasNonComputedProperty(field)) ? field?.isCreatable : undefined;
}

export function isUnique(field?: Field): boolean | undefined {
  return (field && hasNonComputedProperty(field)) ? field?.isUnique : undefined;
}

export function getDynamicLinkDomain(projectName: string, project: ProjectConfiguration): string {
  if (project.dynamicLinkDomain) {
    return `${project.dynamicLinkDomain}`;
  }
  const projectDomain = project.domain ?? `${projectName}.web.app`;
  return `${projectDomain}/links`;
}

export function isDynamicLinkAttributeFromField(value?: DynamicLinkAttribute): value is DynamicLinkAttributeFromField {
  return value !== undefined && value.hasOwnProperty('field');
}

export function getPascalCollectionName(collectionName: string): string {
  const singularized = pluralize.singular(collectionName);
  return singularized[0].toUpperCase() + singularized.substring(1);
}

export function writePrettyFile(fileName: string, content: string) {
  const prettyContent = prettier.format(content, { parser: "typescript" });
  fs.writeFileSync(fileName, prettyContent);
}