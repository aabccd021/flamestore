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
        dataName: field.reference,
        fields: [{ fName, fValue: `${incrementStr}(1)` }],
      },
    },
    {
      colName: field.collection,
      type: "Delete",
      useSelfDocData: true,
      updatedData: {
        dataName: field.reference,
        fields: [{ fName, fValue: `${incrementStr}(-1)` }],
      },
    },
  ];
}
