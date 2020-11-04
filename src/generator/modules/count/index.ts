import { FlamestoreSchema, FieldTypes, Collection, Field, TriggerMap, FlamestoreModule } from "../../type";
import { assertCollectionNameExists, assertFieldHasTypeOf } from "../../util";

export const module: FlamestoreModule = {
  validate,
  triggerGenerator,
};

function validate(schema: FlamestoreSchema) {
  Object.entries(schema.collections).forEach(([colName, col]) =>
    Object.entries(col.fields).forEach(([fieldName, field]) => {
      const count = field.count;
      if (count) {
        const stackTrace = `collections.${colName}.${fieldName}.count`;
        assertCollectionNameExists(count.collection, schema, `${stackTrace}.collection`)
        assertFieldHasTypeOf(count.collection, count.reference, FieldTypes.PATH, schema, `${stackTrace}.reference`)
      }
    })
  );
}

function triggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  __: Collection,
  fieldName: string,
  field: Field,
): TriggerMap {
  if (field.count) {
    const targetRef = field.count.reference;
    const colTriggerMap = triggerMap[field.count.collection];

    triggerMap[collectionName].createTrigger.addData(
      'snapshotRef',
      fieldName,
      '0',
    );

    colTriggerMap.createTrigger.addData(
      targetRef,
      fieldName,
      'increment(1)'
    );

    colTriggerMap.deleteTrigger.addData(
      targetRef,
      fieldName,
      'increment(-1)'
    );
  }
  return triggerMap;
}