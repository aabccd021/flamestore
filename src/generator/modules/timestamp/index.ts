import { TriggerMap, Collection, Field, FlamestoreModule } from "../../type";

export const module: FlamestoreModule = {
  triggerGenerator,
}

function triggerGenerator(
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
