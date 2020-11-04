import { Collection, Field } from "../../../types/schema";
import { TriggerMap } from "../interface";

export function serverTimestampTrigger(
  triggerMap: TriggerMap,
  collectionName: string,
  _: Collection,
  fieldName: string,
  field: Field,
): TriggerMap {
  if (field.type?.timestamp?.serverTimestamp) {
    triggerMap[collectionName].createTrigger.addData(
      'snapshotRef',
      fieldName,
      'firestore.FieldValue.serverTimestamp()'
    );
  }
  return triggerMap;
}
