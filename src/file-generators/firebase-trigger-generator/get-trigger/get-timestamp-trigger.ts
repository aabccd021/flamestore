import { FieldIteration } from "../../../type";
import { getServerTimestampStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getTimestampTrigger(
  _: "serverTimestamp",
  { fName, colName }: FieldIteration
): Trigger[] {
  return [
    {
      colName,
      type: "Create",
      docData: { fName, value: getServerTimestampStr() },
    },
  ];
}
