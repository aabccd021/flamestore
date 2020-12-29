import { FieldIteration, SumField } from "../../../type";
import {
  getDataFieldStr,
  getIncrementStr,
} from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getSumTrigger(
  field: SumField,
  { fName, colName }: FieldIteration
): Trigger[] {
  const targetRef = field.reference;
  const incField = field.field;
  const dataField = getDataFieldStr(incField);
  const updateValueDiffStr = `after.${incField} - before.${incField}`;
  const updateIncStr = getIncrementStr(updateValueDiffStr);
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
        dataName: targetRef,
        field: { fName, value: getIncrementStr(dataField) },
      },
    },
    {
      colName: field.collection,
      type: "Update",
      useDocData: true,
      updatedData: {
        dataName: targetRef,
        field: {
          fName,
          value:
            `before.${incField} !== after.${incField}` +
            ` ? ${updateIncStr} : null`,
        },
      },
    },
    {
      colName: field.collection,
      type: "Delete",
      useDocData: true,
      updatedData: {
        dataName: targetRef,
        field: { fName, value: getIncrementStr(`-${dataField}`) },
      },
    },
  ];
}
