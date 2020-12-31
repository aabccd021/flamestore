import { Field } from "../../../types";
import { getFoundDuplicateStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getBaseTrigger(fieldEntry: {
  field: Field;
  fName: string;
  colName: string;
}): Trigger[] {
  const { field, fName, colName } = fieldEntry;
  const triggers: Trigger[] = [];
  if (field.isUnique) {
    const foundDuplicateStr = getFoundDuplicateStr(
      `'${colName}'`,
      `'${fName}'`,
      "snapshot",
      "context"
    );
    const handleDuplicateStr = getHandleDuplicateStr({ foundDuplicateStr });
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

function getHandleDuplicateStr(param: { foundDuplicateStr: string }): string {
  const { foundDuplicateStr } = param;
  return `if (await ${foundDuplicateStr}) return;`;
}
