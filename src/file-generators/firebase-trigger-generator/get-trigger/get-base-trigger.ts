import { FieldIteration } from "../../../type";
import { isFieldUnique } from "../../util";
import { getFoundDuplicateStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getBaseTrigger({
  field,
  fName,
  colName,
}: FieldIteration): Trigger[] {
  const triggers: Trigger[] = [];
  if (isFieldUnique(field)) {
    const foundDuplicateStr = getFoundDuplicateStr(
      `'${colName}'`,
      `'${fName}'`,
      "snapshot",
      "context"
    );
    const handleDuplicateStr = `if (await ${foundDuplicateStr}) return;`;
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
