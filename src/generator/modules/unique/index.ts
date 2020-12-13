import { FieldIteration } from "../../../type";
import { addTriggerHeader, FlamestoreModule, TriggerMap } from "../../type";
import { isFieldUnique } from "../../util";

export const module: FlamestoreModule = {
  triggerGenerator,
};

function triggerGenerator(
  triggerMap: TriggerMap,
  { field, fName, colName }: FieldIteration
): TriggerMap {
  if (isFieldUnique(field)) {
    triggerMap[colName].createTrigger = addTriggerHeader(
      triggerMap[colName].createTrigger,
      `if (await foundDuplicate('${colName}','${fName}', snapshot, context)) return;`
    );
    triggerMap[colName].createTrigger.useContext = true;

    triggerMap[colName].updateTrigger = addTriggerHeader(
      triggerMap[colName].updateTrigger,
      `if (await foundDuplicate('${colName}','${fName}', change, context)) return;`
    );
    triggerMap[colName].updateTrigger.useContext = true;
  }
  return triggerMap;
}
