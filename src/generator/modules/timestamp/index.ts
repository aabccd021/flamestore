import { TriggerMap, Collection, Field, FlamestoreModule } from "../../type";

export const module: FlamestoreModule = {
  triggerGenerator,
  isCreatable: (field: Field) => field?.type?.timestamp?.serverTimestamp == null,
  isUpdatable: (field: Field) => field?.type?.timestamp?.serverTimestamp == null,
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
      'serverTimestamp()'
    );
  }
  return triggerMap;
}
