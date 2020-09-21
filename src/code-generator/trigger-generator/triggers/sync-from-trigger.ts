import { TriggerMap } from "../interface";
import { FieldContent, CollectionContent, Schema } from "../../../utils/interface";
import { getPascalCollectionName } from "../../generator-util";
import { getColNameToSyncFrom } from "../../../utils/sync-from-util";

export function syncFromTriggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  __: CollectionContent,
  fieldName: string,
  field: FieldContent,
  schema: Schema,
): TriggerMap {
  if (field.syncFrom) {
    const syncFrom = field.syncFrom;
    const colNameToSyncFrom = getColNameToSyncFrom(collectionName, fieldName, schema);

    // triggerMap[collectionName].createTrigger.dependencyPromises[`ref${colNameToSyncFrom}Data`] =
    //   { promise: `data.${syncFrom.reference}.get()`, collection: colNameToSyncFrom };

    // triggerMap[collectionName].createTrigger.addData(
    //   'snapshotRef',
    //   fieldName,
    //   `ref${colNameToSyncFrom}Data.${syncFrom.field}`
    // );

    triggerMap[colNameToSyncFrom].updateTrigger.addNonUpdateData(
      `${collectionName}${getPascalCollectionName(syncFrom.reference)}`,
      fieldName,
      `after.${syncFrom.field}`,
      `after.${syncFrom.field} !== before.${syncFrom.field}`
    );

    triggerMap[colNameToSyncFrom].updateTrigger.addResultPromise(
      `queryUpdate(
        '${collectionName}',
        '${syncFrom.reference}',
        snapshot.after.ref,
        ${collectionName}${getPascalCollectionName(syncFrom.reference)}Data
        ),`
    );
  }
  return triggerMap;
}