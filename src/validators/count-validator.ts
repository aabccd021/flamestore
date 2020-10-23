import { FlamestoreSchema, FieldTypes } from "../utils/interface";
import { assertFieldHasTypeOf } from "../utils/field-util";
import { assertCollectionNameExists } from "../utils/collection-util";


export default function validateCount(schema: FlamestoreSchema) {
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (field.count) {
        const stackTrace = `collections.${collectionName}.${fieldName}.count`;
        assertCollectionNameExists(field.count.collection, schema, `${stackTrace}.collection`)
        assertFieldHasTypeOf(field.count.collection, field.count.reference, FieldTypes.PATH, schema, `${stackTrace}.reference`)
      }
    }
  }
}

