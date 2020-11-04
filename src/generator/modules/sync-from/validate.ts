import { FlamestoreSchema } from "../../types/schema";
import { getColNameToSyncFrom } from "../../utils/util";


export function validate(schema: FlamestoreSchema) {
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (field.syncFrom) {
        getColNameToSyncFrom(collectionName, fieldName, schema);
      }
    }
  }
}

