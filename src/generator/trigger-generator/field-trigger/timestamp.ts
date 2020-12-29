import { FieldIteration } from "../../../type";
import { getServerTimestampStr } from "../templates";
import { Trigger } from "../types";

export function timestampTriggerGenerator(
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
