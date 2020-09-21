import { assertCollectionNameExists } from './collection-util';
import { Schema, FieldContent, FieldType, ReferenceField, IntField, FieldTypes } from './interface';

export function assertFieldExists(collectionName: string, fieldName: string, schema: Schema, stackTrace: string) {
  assertCollectionNameExists(collectionName, schema, stackTrace);
  if (!Object.keys(schema.collections[collectionName].fields).includes(fieldName)) {
    throw Error(
      `${stackTrace} provided field with name ${fieldName} in collection ${collectionName} when the field doesn't exist.`
    );
  }
}

export function assertFieldHasType(collectionName: string, fieldName: string, schema: Schema, stackTrace: string) {
  assertFieldExists(collectionName, fieldName, schema, stackTrace);
  const field = schema.collections[collectionName].fields[fieldName];
  if (!field.type) {
    throw Error(`'type' field is required in ${stackTrace}.`)
  }
}

export function throwFieldTypeError(
  fieldType: FieldTypes, collectionName: string, fieldName: string, schema: Schema, stackTrace: string
) {
  throw Error(`collections.${collectionName}.${fieldName} must be type of ${fieldType} as required in ${stackTrace}.`)
}

export function assertFieldHasTypeOf(
  collectionName: string, fieldName: string, fieldType: FieldTypes, schema: Schema, stackTrace: string
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


export function assertFieldIsKey(collectionName: string, fieldName: string, schema: Schema, prepend: string) {
  assertFieldExists(collectionName, fieldName, schema, prepend);
  const field = schema.collections[collectionName].fields[fieldName];
  if (!field.isKey) {
    throw Error(`[${prepend}] field [${collectionName} ${fieldName}] isKey property must be true`)
  }
}

