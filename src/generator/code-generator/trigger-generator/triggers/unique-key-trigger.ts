import { FlamestoreSchema, Collection, FieldContent } from "../../../types/schema";
import { getPascalCollectionName as pascalOf } from "../../generator-util";
import { TriggerMap } from "../interface";

export function uniqueKeyTriggerGenerator(
  // TODO: sepertinya udah ga butuh unique key
  triggerMap: TriggerMap,
  collectionName: string,
  collection: Collection,
  _: string,
  __: FieldContent,
): TriggerMap {
  const existingDocsFilter = getExistingDocsFilter(collection);
  if (existingDocsFilter) {
    let keys = '';
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (field.isKey) {
        keys += `${fieldName}: data.${fieldName},`;
      }
    }
    triggerMap[collectionName].createTrigger.addHeader(`const keyDuplicates = await firestore().collection("${collectionName}")${existingDocsFilter}.get();
        if (keyDuplicates.docs.length > 1) {
          warn('Duplicate key created on ${collectionName}', {snapshot, context});
          return snapshot.ref.delete();
        }`);
  }
  return triggerMap;
}

function getExistingDocsFilter(collection: Collection): string {
  let content = '';
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    if (field.isKey) {
      content += `.where("${fieldName}","==", data.${fieldName})`;
    }
  }
  return content;
}