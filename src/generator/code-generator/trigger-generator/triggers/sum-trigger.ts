import { Field, Collection } from "../../../types/schema";
import { TriggerMap } from "../interface";

export function sumTriggerGenerator(
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


