import { ServerTimestampField } from "../../../generator-types";
import { getServerTimestampStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getServerTimestampTrigger(
  _: ServerTimestampField,
  { fName, colName }: { fName: string; colName: string }
): Trigger[] {
  const fValue = getServerTimestampStr();
  const type = "Create";
  return [{ colName, type, docData: { fName, fValue } }];
}
