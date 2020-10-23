import { FlamestoreSchema, ReferenceField, FieldTypes } from "../utils/interface";
import { assertFieldExists, assertFieldHasType, assertFieldHasTypeOf, throwFieldTypeError } from "../utils/field-util";
import { getColNameToSyncFrom } from "../utils/sync-from-util";


export default function validateSyncFrom(schema: FlamestoreSchema) {
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (field.syncFrom) {
        getColNameToSyncFrom(collectionName, fieldName, schema);
      }
    }
  }
}

