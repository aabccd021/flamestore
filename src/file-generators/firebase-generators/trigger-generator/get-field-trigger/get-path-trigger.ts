import _ from "lodash";
import { PathField } from "../../../generator-types";
import { t, toSingularColName } from "../../../generator-utils";
import { getSyncFieldStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getPathTrigger(
  field: PathField,
  { fName, colName }: { fName: string; colName: string }
): Trigger[] {
  const syncFields = field.syncFields;
  if (syncFields.length === 0) return [];

  //
  const pascalFName = _.upperFirst(fName);
  const singularColName = toSingularColName(colName);
  const syncColName = field.colName;
  const refDataStr = getRefDataStr({ singularColName, pascalFName });
  const onCreateDataStrMap = syncFields.map(({ fName }) =>
    syncFieldToCreateStr({ fName, refDataStr })
  );
  const onCreateDataStr = t`{${onCreateDataStrMap}}`;
  const onUpdateDataStrMap = syncFields.map(syncFieldToUpdateStr);
  const onUpdateDataStr = t`{${onUpdateDataStrMap}}`;
  const dataName = t`${colName}${pascalFName}Data`;
  const syncFieldStr = getSyncFieldStr(
    t`'${colName}'`,
    t`'${fName}'`,
    t`snapshot`,
    dataName
  );
  return [
    {
      colName,
      type: "Create",
      docData: { fName, fValue: onCreateDataStr },
      dependency: { key: refDataStr, fName, colName: syncColName },
    },
    {
      colName: syncColName,
      type: "Update",
      useDocData: true,
      nonUpdatedData: { dataName, field: { fName, fValue: onUpdateDataStr } },
      resultPromise: syncFieldStr,
    },
  ];
}

// TODO: change "!==" depends on type, use isEqual for timestamp and reference
function syncFieldToUpdateStr({ fName }: { fName: string }): string {
  return t`${fName}: before.${fName} !== after.${fName} ? after.${fName}: null`;
}

function syncFieldToCreateStr(param: {
  fName: string;
  refDataStr: string;
}): string {
  const { fName, refDataStr } = param;
  return t`${fName}:${refDataStr}.${fName}`;
}

function getRefDataStr(param: {
  singularColName: string;
  pascalFName: string;
}): string {
  const { singularColName, pascalFName } = param;
  return t`${singularColName}${pascalFName}Data`;
}
