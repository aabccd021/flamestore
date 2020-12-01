import { TriggerMap, Collection, Field, FlamestoreModule, FieldTypes } from "../../../type";
import { isTypeDatetime } from "../../util";

export const module: FlamestoreModule = {
  triggerGenerator,
  isCreatable: (field: Field) => isTypeDatetime(field.type) && !field.type.timestamp.isServerTimestamp,
  isUpdatable: (field: Field) => isTypeDatetime(field.type) && !field.type.timestamp.isServerTimestamp,
  isPrimitive: (field: Field) => !isTypeDatetime(field.type),
  getRule
}

function getRule(fieldName: string, field: Field) {
  if (isTypeDatetime(field.type) && !field.type.timestamp.isServerTimestamp) {
    return [`${fieldName} is ${FieldTypes.DATETIME}`];
  }
  return [];
}

function triggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  _: Collection,
  fieldName: string,
  field: Field,
): TriggerMap {
  if (isTypeDatetime(field.type) && field.type?.timestamp?.isServerTimestamp) {
    triggerMap[collectionName].createTrigger.addData(
      'snapshotRef',
      fieldName,
      'serverTimestamp()'
    );
  }
  return triggerMap;
}
