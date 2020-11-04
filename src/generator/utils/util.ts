import * as fs from 'fs';
import { FieldTypes, FlamestoreSchema } from "../types/schema";

export function assertCollectionNameExists(collectionName: string, schema: FlamestoreSchema, stackTrace: string) {
  if (!Object.keys(schema.collections).includes(collectionName)) {
    throw Error(
      `Invalid Collection: ${stackTrace} provided collection with name ${collectionName} which doesn't exist`
    );
  };
}


export function assertFieldExists(collectionName: string, fieldName: string, schema: FlamestoreSchema, stackTrace: string) {
  assertCollectionNameExists(collectionName, schema, stackTrace);
  if (!Object.keys(schema.collections[collectionName].fields).includes(fieldName)) {
    throw Error(
      `${stackTrace} provided field with name ${fieldName} in collection ${collectionName} when the field doesn't exist.`
    );
  }
}

export function assertFieldHasType(collectionName: string, fieldName: string, schema: FlamestoreSchema, stackTrace: string) {
  assertFieldExists(collectionName, fieldName, schema, stackTrace);
  const field = schema.collections[collectionName].fields[fieldName];
  if (!field.type) {
    throw Error(`'type' field is required in ${stackTrace}.`)
  }
}

export function throwFieldTypeError(
  fieldType: FieldTypes, collectionName: string, fieldName: string, schema: FlamestoreSchema, stackTrace: string
) {
  throw Error(`collections.${collectionName}.${fieldName} must be type of ${fieldType} as required in ${stackTrace}.`)
}

export function assertFieldHasTypeOf(
  collectionName: string, fieldName: string, fieldType: FieldTypes, schema: FlamestoreSchema, stackTrace: string
) {
  assertFieldHasType(collectionName, fieldName, schema, stackTrace);

  const type = schema.collections[collectionName].fields[fieldName].type;
  if (fieldType === FieldTypes.INT && !type?.int) {
    throwFieldTypeError(FieldTypes.INT, collectionName, fieldName, schema, stackTrace);
  }
  if (fieldType === FieldTypes.STRING && !type?.string) {
    throwFieldTypeError(FieldTypes.STRING, collectionName, fieldName, schema, stackTrace);
  }
  if (fieldType === FieldTypes.PATH && !type?.path) {
    throwFieldTypeError(FieldTypes.PATH, collectionName, fieldName, schema, stackTrace);
  }
  if (fieldType === FieldTypes.DATETIME && !type?.timestamp) {
    throwFieldTypeError(FieldTypes.DATETIME, collectionName, fieldName, schema, stackTrace);
  }
}


export function assertFieldIsKey(collectionName: string, fieldName: string, schema: FlamestoreSchema, prepend: string) {
  assertFieldExists(collectionName, fieldName, schema, prepend);
  const field = schema.collections[collectionName].fields[fieldName];
  if (!field.isKey) {
    throw Error(`[${prepend}] field [${collectionName} ${fieldName}] isKey property must be true`)
  }
}

export function getColNameToSyncFrom(collectionName: string, fieldName: string, schema: FlamestoreSchema) {
  const collection = schema.collections[collectionName];
  const field = collection.fields[fieldName];
  const stackTrace = `collections.${collectionName}.${fieldName}.syncFrom`;
  if (field.syncFrom) {
    const referenceFieldName = field.syncFrom.reference;
    assertFieldHasTypeOf(
      collectionName, referenceFieldName, FieldTypes.PATH, schema, `${stackTrace}.reference`
    )
    const collectionNameToSyncFrom = collection.fields[referenceFieldName].type!.path!.collection;
    assertFieldExists(collectionNameToSyncFrom, field.syncFrom.field, schema, `${stackTrace}.field`)
    return collectionNameToSyncFrom;
  }
  throw Error('Not an syncFrom field');
}
