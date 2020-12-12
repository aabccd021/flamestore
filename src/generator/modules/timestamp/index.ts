import {
  TriggerMap,
  Collection,
  Field,
  FlamestoreModule,
  FieldTypes,
} from "../../../type";
import { isTypeDatetime } from "../../util";

export const module: FlamestoreModule = {
  triggerGenerator,
  isCreatable: (field: Field) => isTypeDatetime(field),
  isUpdatable: (field: Field) => isTypeDatetime(field),
  isPrimitive: (field: Field) => !isTypeDatetime(field),
  getRule,
};

function getRule(fieldName: string, field: Field): string[] {
  if (isTypeDatetime(field)) {
    return [`${fieldName} is ${FieldTypes.DATETIME}`];
  }
  return [];
}

function triggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  _: Collection,
  fieldName: string,
  field: Field
): TriggerMap {
  if (field === "serverTimestamp") {
    triggerMap[collectionName].createTrigger.addData(
      "snapshotRef",
      fieldName,
      "serverTimestamp()"
    );
  }
  return triggerMap;
}
