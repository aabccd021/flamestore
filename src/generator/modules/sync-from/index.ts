import { Collection, Field, FlamestoreModule, FlamestoreSchema, TriggerMap } from "../../../type";
import { getColNameToSyncFrom, getPascalCollectionName, isTypeSyncFrom } from "../../util";

export const module: FlamestoreModule = {
  validate,
  triggerGenerator
};

function validate(schema: FlamestoreSchema) {
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (isTypeSyncFrom(field.type)) {
        getColNameToSyncFrom(collectionName, fieldName, schema);
      }
    }
  }
}

function triggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  __: Collection,
  fieldName: string,
  field: Field,
  schema: FlamestoreSchema,
): TriggerMap {
  if (isTypeSyncFrom(field.type)) {
    const syncFrom = field.type.syncFrom;
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