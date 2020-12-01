import { FlamestoreSchema, FieldTypes, Collection, Field, TriggerMap, FlamestoreModule } from "../../../type";
import { assertCollectionNameExists, assertFieldHasTypeOf, isTypeSum } from "../../util";

export const module: FlamestoreModule = {
  validate,
  triggerGenerator,
};

function validate(schema: FlamestoreSchema) {
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      const fieldType = field.type;
      if (isTypeSum(fieldType)) {
        const stackTrace = `collections.${collectionName}.${fieldName}.sum`;
        assertCollectionNameExists(fieldType.sum.collection, schema, `${stackTrace}.collection`)
        assertFieldHasTypeOf(fieldType.sum.collection, fieldType.sum.reference, FieldTypes.PATH, schema, `${stackTrace}.reference`)
        assertFieldHasTypeOf(fieldType.sum.collection, fieldType.sum.field, FieldTypes.INT, schema, `${stackTrace}.field`)
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
  const fieldType = field.type;
  if (isTypeSum(fieldType)) {
    const targetRef = fieldType.sum.reference;
    const incrementField = fieldType.sum.field;

    triggerMap[collectionName].createTrigger.addData(
      'snapshotRef',
      fieldName,
      '0',
    );

    triggerMap[fieldType.sum.collection].createTrigger.addData(
      targetRef,
      fieldName,
      `increment(data.${incrementField})`
    );

    triggerMap[fieldType.sum.collection].updateTrigger.addData(
      targetRef,
      fieldName,
      `increment(after.${incrementField} - before.${incrementField})`,
      `after.${incrementField} !== before.${incrementField}`
    );

    triggerMap[fieldType.sum.collection].deleteTrigger.addData(
      targetRef,
      fieldName,
      `increment(-data.${incrementField})`
    );
  }
  return triggerMap;
}
