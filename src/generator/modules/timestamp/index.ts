import { TriggerMap, Collection, Field, FlamestoreModule } from "../../type";

export const module: FlamestoreModule = {
  triggerGenerator,
  isCreatable: (field: Field) => field?.type?.timestamp?.serverTimestamp == null || field?.type?.timestamp?.serverTimestamp === false,
  isUpdatable: (field: Field) => field?.type?.timestamp?.serverTimestamp == null || field?.type?.timestamp?.serverTimestamp === false,
  isPrimitive: (field: Field) => field?.type?.timestamp == null,
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
