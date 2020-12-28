import { FieldIteration } from "../../../type";
import { serverTimestampStr } from "../constants";
import { Trigger } from "../type";

export function timestampTriggerGenerator(
  _: "serverTimestamp",
  { fName, colName }: FieldIteration
): Trigger[] {
  return [
    {
      colName,
      type: "Create",
      docData: { fName, fValue: `${serverTimestampStr}()` },
    },
  ];
}
