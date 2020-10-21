import { CollectionContent, FieldContent } from "../../../utils/interface";
import { TriggerMap } from "../interface";

export function defaultFieldTriggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  _: CollectionContent,
  fieldName: string,
  field: FieldContent,
): TriggerMap {
  if (field.type?.timestamp) {
    triggerMap[collectionName].createTrigger.addData(
      'snapshotRef',
      fieldName,
      'firestore.FieldValue.serverTimestamp'
    );
  }
  return triggerMap;
}
