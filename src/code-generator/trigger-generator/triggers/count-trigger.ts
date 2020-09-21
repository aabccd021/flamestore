import { TriggerMap } from "../interface";
import { FieldContent, CollectionContent } from "../../../utils/interface";


export function countTriggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  __: CollectionContent,
  fieldName: string,
  field: FieldContent,
): TriggerMap {
  if (field.count) {
    const targetRef = field.count.reference;
    const colTriggerMap = triggerMap[field.count.collection];

    // triggerMap[collectionName].createTrigger.addData(
    //   'snapshotRef',
    //   fieldName,
    //   '0',
    // );

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