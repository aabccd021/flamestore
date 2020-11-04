import { FieldContent, CollectionContent } from "../../../utils/interface";
import { TriggerMap } from "../interface";

export function sumTriggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  __: CollectionContent,
  fieldName: string,
  field: FieldContent,
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


