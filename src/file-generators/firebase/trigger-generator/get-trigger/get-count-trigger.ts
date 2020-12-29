import { CountField } from "../../../../type";
import { getIncrementStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getCountTrigger(
  field: CountField,
  { fName, colName }: { fName: string; colName: string }
): Trigger[] {
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
