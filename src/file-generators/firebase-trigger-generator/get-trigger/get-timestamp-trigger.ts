import { getServerTimestampStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getTimestampTrigger(
  _: "serverTimestamp",
  { fName, colName }: { fName: string; colName: string }
): Trigger[] {
  return [
    {
      colName,
      type: "Create",
      docData: { fName, value: getServerTimestampStr() },
    },
  ];
}
