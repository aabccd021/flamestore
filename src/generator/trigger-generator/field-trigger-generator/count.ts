import { CountField, FieldIteration } from "../../../type";
import { incrementStr } from "../constants";
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
      type: "Create",
      docData: { fName, fValue: "0" },
    },
    {
      colName: field.collection,
      type: "Create",
      useDocData: true,
      updatedData: {
        dataName: field.reference,
        field: { fName, fValue: `${incrementStr}(1)` },
      },
    },
    {
      colName: field.collection,
      type: "Delete",
      useDocData: true,
      updatedData: {
        dataName: field.reference,
        field: { fName, fValue: `${incrementStr}(-1)` },
      },
    },
  ];
}
