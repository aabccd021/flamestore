import { FieldIteration, SumField } from "../../../type";
import { Trigger } from "../type";

export function sumTriggerGenerator(
  field: SumField,
  { fName, colName }: FieldIteration
): Trigger[] {
  const targetRef = field.reference;
  const incrementField = field.field;
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
          dataName: targetRef,
          fName,
          fValue: `increment(data.${incrementField})`,
        },
      ],
    },
    {
      colName: field.collection,
      triggerType: "Update",
      useThisData: true,
      data: [
        {
          dataName: targetRef,
          fName,
          fValue:
            `before.${incrementField} !== after.${incrementField} ?` +
            `increment(after.${incrementField} - before.${incrementField}) : null`,
        },
      ],
    },
    {
      colName: field.collection,
      triggerType: "Delete",
      useThisData: true,
      data: [
        {
          dataName: targetRef,
          fName,
          fValue: `increment(-data.${incrementField})`,
        },
      ],
    },
  ];
}
