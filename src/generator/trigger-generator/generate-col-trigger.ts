import { CollectionIteration } from "../../type";
import { getTriggerString } from "./generate-trigger";
import { modelImports, utilImports } from "./templates";
import { Trigger, triggerTypes } from "./type";

export function getColTriggerString(
  colIter: CollectionIteration,
  colTriggers: Trigger[]
): string {
  const { schema } = colIter;
  const triggersString = triggerTypes
    .map((triggerType) => {
      const triggers = colTriggers.filter((t) => t.triggerType === triggerType);
      return getTriggerString(colIter, triggerType, triggers);
    })
    .join("");
  return modelImports(schema) + utilImports + triggersString;
}
