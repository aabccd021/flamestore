import { FieldIteration } from "../../../type";
import { isFieldUnique } from "../../util";
import { foundDuplicateStr } from "../constants";
import { Trigger } from "../type";

export function baseTriggerGenerator({
  field,
  fName,
  colName,
}: FieldIteration): Trigger[] {
  if (isFieldUnique(field)) {
    const handleDuplicateStr = `if (await ${foundDuplicateStr}( '${colName}','${fName}', snapshot, context)) return;`;
    return [
      {
        colName,
        type: "Create",
        useContext: true,
        header: [handleDuplicateStr],
      },

      {
        colName,
        type: "Update",
        useContext: true,
        header: [handleDuplicateStr],
      },
    ];
  }
  return [];
}
