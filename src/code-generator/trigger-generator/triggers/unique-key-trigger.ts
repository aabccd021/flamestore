import { Schema, CollectionContent, FieldContent } from "../../../utils/interface";
import { getPascalCollectionName as pascalOf } from "../../generator-util";
import { TriggerMap } from "../interface";

export function uniqueKeyTriggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  collection: CollectionContent,
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

function getExistingDocsFilter(collection: CollectionContent): string {
  let content = '';
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    if (field.isKey) {
      content += `.where("${fieldName}","==", data.${fieldName})`;
    }
  }
  return content;
}