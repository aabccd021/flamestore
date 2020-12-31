import _ from "lodash";
import { PathField } from "../../../types";
import { toSingularColName } from "../../../generator-utils";
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
  const syncColName = field.collection;
  const refDataStr = getRefDataStr({ singularColName, pascalFName });
  const onCreateDataStrMap = syncFields.map(({ fName }) =>
    syncFieldToCreateStr({ fName, refDataStr })
  );
  const onCreateDataStr = `{${onCreateDataStrMap}}`;
  const onUpdateDataStrMap = syncFields.map(syncFieldToUpdateStr);
  const onUpdateDataStr = `{${onUpdateDataStrMap}}`;
  const dataName = `${colName}${pascalFName}Data`;
  const syncFieldStr = getSyncFieldStr(
    `'${colName}'`,
    `'${fName}'`,
    `snapshot`,
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
  return `${fName}: before.${fName} !== after.${fName} ? after.${fName}: null`;
}

function syncFieldToCreateStr(param: {
  fName: string;
  refDataStr: string;
}): string {
  const { fName, refDataStr } = param;
  return `${fName}:${refDataStr}.${fName}`;
}

function getRefDataStr(param: {
  singularColName: string;
  pascalFName: string;
}): string {
  const { singularColName, pascalFName } = param;
  return `${singularColName}${pascalFName}Data`;
}
