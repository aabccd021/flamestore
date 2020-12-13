import { FieldIteration } from "../../../type";
import { addTriggerData, FlamestoreModule, TriggerMap } from "../../type";
import { isTypeDatetime } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: ({ field }) => isTypeDatetime(field),
  isUpdatable: ({ field }) => isTypeDatetime(field),
  isPrimitive: ({ field }) => !isTypeDatetime(field),
  getRule({ fName, field }) {
    if (isTypeDatetime(field)) {
      return [`${fName} is datetime`];
    }
    return [];
  },
  triggerGenerator(
    triggerMap: TriggerMap,
    { field, colName, fName }: FieldIteration
  ): TriggerMap {
    if (field === "serverTimestamp") {
      triggerMap[colName].createTrigger = addTriggerData(
        triggerMap[colName].createTrigger,
        "snapshotRef",
        fName,
        "serverTimestamp()"
      );
    }
    return triggerMap;
  },
};
