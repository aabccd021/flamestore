import { FieldIteration, SumField } from "../../../type";
import { incrementStr } from "../constants";
import { dataFieldT } from "../templates";
import { Trigger } from "../type";

export function sumTriggerGenerator(
  field: SumField,
  { fName, colName }: FieldIteration
): Trigger[] {
  const targetRef = field.reference;
  const incField = field.field;
  const dataField = dataFieldT(incField);
  return [
    {
      colName,
      triggerType: "Create",
      thisData: {
        fName,
        fValue: "0",
      },
    },
    {
      colName: field.collection,
      triggerType: "Create",
      useThisData: true,
      data: {
        dataName: targetRef,
        fields: [{ fName, fValue: `${incrementStr}(${dataField})` }],
      },
    },
    {
      colName: field.collection,
      triggerType: "Update",
      useThisData: true,
      data: {
        dataName: targetRef,
        fields: [
          {
            fName,
            fValue:
              `before.${incField} !== after.${incField}` +
              `? ${incrementStr}(after.${incField} - before.${incField})` +
              ": null",
          },
        ],
      },
    },
    {
      colName: field.collection,
      triggerType: "Delete",
      useThisData: true,
      data: {
        dataName: targetRef,
        fields: [{ fName, fValue: `${incrementStr}(-${dataField})` }],
      },
    },
  ];
}
