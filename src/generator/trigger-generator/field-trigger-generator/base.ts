import { FieldIteration } from "../../../type";
import { isFieldUnique } from "../../util";
import { foundDuplicateStr } from "../constants";
import { Trigger } from "../type";

export function baseTriggerGenerator({
  field,
  fName,
  colName,
}: FieldIteration): Trigger[] {
  const triggers: Trigger[] = [];
  if (isFieldUnique(field)) {
    const handleDuplicateStr =
      `if (await ${foundDuplicateStr}` +
      `('${colName}','${fName}', snapshot, context))` +
      `return;`;
    triggers.push({
      colName,
      type: "Create",
      useContext: true,
      header: handleDuplicateStr,
    });
    triggers.push({
      colName,
      type: "Update",
      useContext: true,
      header: handleDuplicateStr,
    });
  }
  return triggers;
}
