import { FieldContent, Schema, FieldType, FieldTypes } from "../utils/interface";
import * as pluralize from 'pluralize';
import { getColNameToSyncFrom } from "../utils/sync-from-util";

export function getDataTypeString(field: FieldContent, fieldName: string, collectionName: string, schema: Schema) {
  const typeMap: Record<FieldTypes, string> = {
    [FieldTypes.STRING]: 'string',
    [FieldTypes.DATETIME]: 'firestore.Timestamp',
    [FieldTypes.INT]: 'number',
    [FieldTypes.PATH]: 'firestore.DocumentReference',
  }
  return typeMap[getFieldType(field, fieldName, collectionName, schema)];
}

function getFieldType(field: FieldContent, fieldName: string, collectionName: string, schema: Schema): FieldTypes {
  if (field.type) {
    for (const fieldType of Object.values(FieldTypes)) {
      if (field.type[fieldType]) {
        return fieldType;
      }
    }
  } else {
    if (field.count || field.sum) {
      return FieldTypes.INT;
    } else if (field.syncFrom) {
      const colNameToSyncFrom = getColNameToSyncFrom(collectionName, fieldName, schema);
      const type = schema.collections[colNameToSyncFrom].fields[field.syncFrom.field].type!;
      for (const fieldType of Object.values(FieldTypes)) {
        if (type[fieldType]) {
          return fieldType;
        }
      }
    }
  }
  throw Error(`Field type ${field.type} is invalid`)
}

export function getPascalCollectionName(collectionName: string): string {
  const singularized = pluralize.singular(collectionName);
  return singularized[0].toUpperCase() + singularized.substring(1);
}

export function getStringAdaptor(
  field: FieldContent, fieldName: string, collectionName: string, schema: Schema
): string {
  const fieldType = getFieldType(field, fieldName, collectionName, schema);
  if (fieldType === FieldTypes.PATH) {
    return '.id';
  }
  return '';
}