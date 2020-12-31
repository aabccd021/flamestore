import { CountField } from "../../../types";
import { getIncrementStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getCountTrigger(
  field: CountField,
  { fName, colName }: { fName: string; colName: string }
): Trigger[] {
  const countColName = field.colName;
  const dataName = field.refName;
  return [
    {
      colName,
      type: "Create",
      docData: { fName, fValue: "0" },
    },
    {
      colName: countColName,
      type: "Create",
      useDocData: true,
      updatedData: { dataName, field: { fName, fValue: getIncrementStr(1) } },
    },
    {
      colName: countColName,
      type: "Delete",
      useDocData: true,
      updatedData: { dataName, field: { fName, fValue: getIncrementStr(-1) } },
    },
  ];
}
