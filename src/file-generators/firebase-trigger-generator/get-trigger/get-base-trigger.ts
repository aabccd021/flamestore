import { Field } from "../../../type";
import { isFieldUnique } from "../../utils";
import { getFoundDuplicateStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getBaseTrigger(param: {
  field: Field;
  fName: string;
  colName: string;
}): Trigger[] {
  const { field, fName, colName } = param;
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
