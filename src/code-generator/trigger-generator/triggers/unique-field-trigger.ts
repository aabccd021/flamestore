import { Schema, CollectionContent, FieldContent } from "../../../utils/interface";
import { getPascalCollectionName as pascalOf } from "../../generator-util";
import { TriggerMap } from "../interface";

export function uniqueFieldTriggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  _: CollectionContent,
  fieldName: string,
  field: FieldContent,
): TriggerMap {
  if (field.isUnique) {
    const duplicateOnKey = `const ${fieldName}Duplicates = await firestore().collection("${collectionName}")`;
    triggerMap[collectionName].createTrigger.addHeader(`${duplicateOnKey}.where("${fieldName}","==", data.${fieldName}).get();
        if (${fieldName}Duplicates.docs.length > 1) {
          warn('Duplicate ${fieldName} created on ${collectionName}', {snapshot, context});
          return snapshot.ref.delete();
        }`);
    triggerMap[collectionName].updateTrigger.addHeader(`${duplicateOnKey}.where("${fieldName}","==", after.${fieldName}).get();
        if (${fieldName}Duplicates.docs.length > 1) {
          warn('Duplicate ${fieldName} updated on ${collectionName}.', {snapshot, context});
          return snapshot.before.ref.update({${fieldName}: before.${fieldName}})
        }`);
  }
  return triggerMap;
}
