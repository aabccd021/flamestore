import { SumField } from "../../../generator-types";
import { t } from "../../../generator-utils";
import {
  getDataFieldStr,
  getIncrementStr,
} from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getSumTrigger(
  field: SumField,
  { fName, colName }: { fName: string; colName: string }
): Trigger[] {
  const dataName = field.refName;
  const incFieldName = field.incFieldName;
  const incColName = field.colName;
  const dataFieldStr = getDataFieldStr({ fName: incFieldName });
  const updateValueDiffStr = getOnUpdateValueDiffStr({ incFieldName });
  const onUpdateIncStr = getIncrementStr(updateValueDiffStr);
  const onUpdateDataStr = getOnUpdateDataStr({ incFieldName, onUpdateIncStr });
  const onCreateIncStr = getIncrementStr(dataFieldStr);
  const onDeleteIncStr = getIncrementStr(`-${dataFieldStr}`);
  return [
    {
      colName,
      type: "Create",
      docData: { fName, fValue: "0" },
    },
    {
      colName: incColName,
      type: "Create",
      useDocData: true,
      updatedData: { dataName, field: { fName, fValue: onCreateIncStr } },
    },
    {
      colName: incColName,
      type: "Update",
      useDocData: true,
      updatedData: { dataName, field: { fName, fValue: onUpdateDataStr } },
    },
    {
      colName: incColName,
      type: "Delete",
      useDocData: true,
      updatedData: { dataName, field: { fName, fValue: onDeleteIncStr } },
    },
  ];
}

function getOnUpdateDataStr(param: {
  incFieldName: string;
  onUpdateIncStr: string;
}): string {
  const { incFieldName: field, onUpdateIncStr } = param;
  return t`before.${field} !== after.${field} ? ${onUpdateIncStr} : null`;
}
function getOnUpdateValueDiffStr({ incFieldName }: { incFieldName: string }) {
  return t`after.${incFieldName} - before.${incFieldName}`;
}
