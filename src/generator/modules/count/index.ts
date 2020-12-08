import { FlamestoreSchema, FieldTypes, Collection, Field, TriggerMap, FlamestoreModule } from "../../../type";
import { assertCollectionNameExists, assertFieldHasTypeOf, isTypeCount } from "../../util";

export const module: FlamestoreModule = {
  validate,
  triggerGenerator,
};

function validate(schema: FlamestoreSchema) {
  Object.entries(schema.collections).forEach(([colName, col]) =>
    Object.entries(col.fields).forEach(([fieldName, field]) => {
      if (isTypeCount(field)) {
        const stackTrace = `collections.${colName}.${fieldName}.count`;
        assertCollectionNameExists(field.count.collection, schema, `${stackTrace}.collection`);
        assertFieldHasTypeOf(field.count.collection, field.count.reference, FieldTypes.PATH, schema, `${stackTrace}.reference`);
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
  if (isTypeCount(field)) {
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