import { FieldIteration } from "../../../type";
import { isFieldUnique } from "../../util";
import { Trigger } from "../type";

export function baseTriggerGenerator({
  field,
  fName,
  colName,
}: FieldIteration): Trigger[] {
  if (isFieldUnique(field)) {
    const foundDuplicateString =
      `if (await foundDuplicate( '${colName}','${fName}', snapshot, context))` +
      ` return;`;
    return [
      {
        colName,
        triggerType: "Create",
        useContext: true,
        header: [foundDuplicateString],
      },

      {
        colName,
        triggerType: "Update",
        useContext: true,
        header: [foundDuplicateString],
      },
    ];
  }
  return [];
}
