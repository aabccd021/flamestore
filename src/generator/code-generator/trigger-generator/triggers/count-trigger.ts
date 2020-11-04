import { Collection, Field } from "../../../schema";
import { TriggerMap } from "../interface";


export function countTriggerGenerator(
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