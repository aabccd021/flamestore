import { ServerTimestampField } from "../../../types";
import { getServerTimestampStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getTimestampTrigger(
  _: ServerTimestampField,
  { fName, colName }: { fName: string; colName: string }
): Trigger[] {
  const serverTimestampStr = getServerTimestampStr();
  return [
    {
      colName,
      type: "Create",
      docData: { fName, fValue: serverTimestampStr },
    },
  ];
}
