import { CountField, FieldIteration } from "../../../type";
import { Trigger } from "../type";

export function countTriggerGenerator({
  field,
  fIter,
}: {
  field: CountField;
  fIter: FieldIteration;
}): Trigger[] {
  const { colName, fName } = fIter;
  return [
    {
      colName,
      triggerType: "Create",
      thisData: [
        {
          fName,
          fValue: "0",
        },
      ],
    },
    {
      colName: field.collection,
      triggerType: "Create",
      useThisData: true,
      data: [
        {
          dataName: field.reference,
          fName,
          fValue: "increment(1)",
        },
      ],
    },
    {
      colName: field.collection,
      triggerType: "Delete",
      useThisData: true,
      data: [
        {
          dataName: field.reference,
          fName,
          fValue: "increment(-1)",
        },
      ],
    },
  ];
}
