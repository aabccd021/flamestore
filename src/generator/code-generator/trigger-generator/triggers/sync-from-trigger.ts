import { TriggerMap } from "../interface";
import { FieldContent, Collection, FlamestoreSchema } from "../../../types/schema";
import { getPascalCollectionName } from "../../generator-util";
import { getColNameToSyncFrom } from "../../../utils/sync-from-util";

export function syncFromTriggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  __: Collection,
  fieldName: string,
  field: FieldContent,
  schema: FlamestoreSchema,
): TriggerMap {
  if (field.syncFrom) {
    const syncFrom = field.syncFrom;
    const colNameToSyncFrom = getColNameToSyncFrom(collectionName, fieldName, schema);

    triggerMap[collectionName].createTrigger.dependencyPromises[`ref${colNameToSyncFrom}Data`] =
      { promise: `data.${syncFrom.reference}.get()`, collection: colNameToSyncFrom };

    triggerMap[collectionName].createTrigger.addData(
      'snapshotRef',
      fieldName,
      `ref${colNameToSyncFrom}Data.${syncFrom.field}`
    );

    triggerMap[colNameToSyncFrom].updateTrigger.addNonUpdateData(
      `${collectionName}${getPascalCollectionName(syncFrom.reference)}`,
      fieldName,
      `after.${syncFrom.field}`,
      `after.${syncFrom.field} !== before.${syncFrom.field}`
    );

    triggerMap[colNameToSyncFrom].updateTrigger.addResultPromise(
      `syncField(
        '${collectionName}',
        '${syncFrom.reference}',
        change.after.ref,
        ${collectionName}${getPascalCollectionName(syncFrom.reference)}Data
        )`
    );
  }
  return triggerMap;
}