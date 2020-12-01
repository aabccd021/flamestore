import { FlamestoreSchema, FieldTypes, Collection, Field, TriggerMap, FlamestoreModule } from "../../../type";
import { assertCollectionNameExists, assertFieldHasTypeOf, isTypeCount } from "../../util";

export const module: FlamestoreModule = {
  validate,
  triggerGenerator,
};

function validate(schema: FlamestoreSchema) {
  Object.entries(schema.collections).forEach(([colName, col]) =>
    Object.entries(col.fields).forEach(([fieldName, field]) => {
      const fieldType = field.type;
      if (isTypeCount(fieldType)) {
        const stackTrace = `collections.${colName}.${fieldName}.count`;
        assertCollectionNameExists(fieldType.count.collection, schema, `${stackTrace}.collection`)
        assertFieldHasTypeOf(fieldType.count.collection, fieldType.count.reference, FieldTypes.PATH, schema, `${stackTrace}.reference`)
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
  const fieldType = field.type;
  if (isTypeCount(fieldType)) {
    const targetRef = fieldType.count.reference;
    const colTriggerMap = triggerMap[fieldType.count.collection];

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