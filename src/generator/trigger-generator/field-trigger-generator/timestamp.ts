import { FieldIteration } from "../../../type";
import { Trigger } from "../type";

export function timestampTriggerGenerator(
  _: "serverTimestamp",
  { fName, colName }: FieldIteration
): Trigger[] {
  return [
    {
      colName,
      triggerType: "Create",
      thisData: [
        {
          fName,
          fValue: "serverTimestamp()",
        },
      ],
    },
  ];
}
