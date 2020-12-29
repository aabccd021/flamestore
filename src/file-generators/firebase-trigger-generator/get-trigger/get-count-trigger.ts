import { CountField, FieldIteration } from "../../../type";
import { getIncrementStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getCountTrigger(
  field: CountField,
  fIter: FieldIteration
): Trigger[] {
  const { colName, fName } = fIter;
  return [
    {
      colName,
      type: "Create",
      docData: { fName, value: "0" },
    },
    {
      colName: field.collection,
      type: "Create",
      useDocData: true,
      updatedData: {
        dataName: field.reference,
        field: { fName, value: getIncrementStr(1) },
      },
    },
    {
      colName: field.collection,
      type: "Delete",
      useDocData: true,
      updatedData: {
        dataName: field.reference,
        field: { fName, value: getIncrementStr(-1) },
      },
    },
  ];
}
