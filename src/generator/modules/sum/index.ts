import { FlamestoreSchema, FieldTypes, Collection, Field, TriggerMap, FlamestoreModule } from "../../type";
import { assertCollectionNameExists, assertFieldHasTypeOf } from "../../util";

export const module: FlamestoreModule = {
  validate,
  triggerGenerator,
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

function triggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  __: Collection,
  fieldName: string,
  field: Field,
): TriggerMap {
  if (field.sum) {
    const targetRef = field.sum.reference;
    const incrementField = field.sum.field;

    triggerMap[collectionName].createTrigger.addData(
      'snapshotRef',
      fieldName,
      '0',
    );

    triggerMap[field.sum.collection].createTrigger.addData(
      targetRef,
      fieldName,
      `increment(data.${incrementField})`
    );

    triggerMap[field.sum.collection].updateTrigger.addData(
      targetRef,
      fieldName,
      `increment(after.${incrementField} - before.${incrementField})`
    );

    triggerMap[field.sum.collection].deleteTrigger.addData(
      targetRef,
      fieldName,
      `increment(-data.${incrementField})`
    );
  }
  return triggerMap;
}
