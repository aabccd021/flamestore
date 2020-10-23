import { assertFieldExists, assertFieldHasTypeOf } from "./field-util";
import { FieldTypes, FlamestoreSchema } from "./interface";

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