import { FlamestoreModule } from "../../module";
import { FlamestoreSchema } from "../../schema";
import { getColNameToSyncFrom } from "../../util";

export const module: FlamestoreModule = {
  validate
};

function validate(schema: FlamestoreSchema) {
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (field.syncFrom) {
        getColNameToSyncFrom(collectionName, fieldName, schema);
      }
    }
  }
}

