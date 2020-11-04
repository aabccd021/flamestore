import { FlamestoreModule } from "../../module";
import { FlamestoreSchema, FieldTypes } from "../../schema";
import { assertCollectionNameExists, assertFieldHasTypeOf } from "../../util";

export const module: FlamestoreModule = {
  validate
};

function validate(schema: FlamestoreSchema) {
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (field.sum) {
        const stackTrace = `collections.${collectionName}.${fieldName}.sum`;
        assertCollectionNameExists(field.sum.collection, schema, `${stackTrace}.collection`)
        assertFieldHasTypeOf(field.sum.collection, field.sum.reference, FieldTypes.PATH, schema, `${stackTrace}.reference`)
        assertFieldHasTypeOf(field.sum.collection, field.sum.field, FieldTypes.INT, schema, `${stackTrace}.field`)
      }
    }
  }
}

