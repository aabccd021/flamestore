import { FieldIteration, SumField } from "../../../type";
import { incrementStr } from "../constants";
import { getDataFieldStr } from "../templates";
import { Trigger } from "../type";

export function sumTriggerGenerator(
  field: SumField,
  { fName, colName }: FieldIteration
): Trigger[] {
  const targetRef = field.reference;
  const incField = field.field;
  const dataField = getDataFieldStr(incField);
  return [
    {
      colName,
      type: "Create",
      selfDocData: {
        fName,
        fValue: "0",
      },
    },
    {
      colName: field.collection,
      type: "Create",
      useSelfDocData: true,
      updatedData: {
        dataName: targetRef,
        fields: [{ fName, fValue: `${incrementStr}(${dataField})` }],
      },
    },
    {
      colName: field.collection,
      type: "Update",
      useSelfDocData: true,
      updatedData: {
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
      type: "Delete",
      useSelfDocData: true,
      updatedData: {
        dataName: targetRef,
        fields: [{ fName, fValue: `${incrementStr}(-${dataField})` }],
      },
    },
  ];
}
