import pluralize from 'pluralize';
import { FlamestoreSchema, FieldTypes, Field } from './type';

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

export function getDataTypeString(
  field: Field, fieldName: string, collectionName: string, schema: FlamestoreSchema) {
  const typeMap: Record<FieldTypes, string> = {
    [FieldTypes.STRING]: 'string',
    [FieldTypes.DATETIME]: 'firestore.Timestamp',
    [FieldTypes.INT]: 'number',
    [FieldTypes.PATH]: 'firestore.DocumentReference',
  }
  return typeMap[getFieldType(field, fieldName, collectionName, schema)];
}

function getFieldType(
  field: Field, fieldName: string, collectionName: string, schema: FlamestoreSchema): FieldTypes {
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
  field: Field, fieldName: string, collectionName: string, schema: FlamestoreSchema
): string {
  const fieldType = getFieldType(field, fieldName, collectionName, schema);
  if (fieldType === FieldTypes.PATH) {
    return '.id';
  }
  return '';
}