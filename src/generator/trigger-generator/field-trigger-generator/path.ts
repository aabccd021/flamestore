import { FieldIteration, ReferenceField } from "../../../type";
import { colIterOf, getSyncFields } from "../../util";
import { syncFieldStr } from "../constants";
import { getPromiseStr } from "../templates";
import { Trigger } from "../type";

export function pathTriggerGenerator(
  field: ReferenceField,
  fIter: FieldIteration
): Trigger[] {
  //
  const { pascalFName, fName, colName, schema, singularColName } = fIter;
  const syncFields = getSyncFields(field, schema);
  if (syncFields.length === 0) return [];

  //
  const { colName: colNameToSyncFrom } = colIterOf(field.collection, schema);
  const refDataStr = `${singularColName}${pascalFName}Data`;
  const onCreateData = syncFields.map(
    ({ fName }) => `${fName}:${refDataStr}.${fName}`
  );
  // TODO: change "!==" depends on type, use isEqual for timestamp and reference
  const onUpdateData = syncFields.map(
    ({ fName: f }) => `${f}: before.${f} !== after.${f} ? after.${f}: null`
  );
  const dataName = `${colName}${pascalFName}Data`;
  const syncField = `${syncFieldStr}('${colName}','${fName}',snapshot,${dataName})`;

  return [
    {
      colName,
      type: "Create",
      docData: { fName, fValue: `{${onCreateData}}` },
      dependency: {
        key: refDataStr,
        promise: getPromiseStr(fName),
        colName: colNameToSyncFrom,
      },
    },
    {
      colName: colNameToSyncFrom,
      type: "Update",
      useDocData: true,
      resultPromise: syncField,
      nonUpdatedData: {
        dataName,
        field: { fName, fValue: `{${onUpdateData}}` },
      },
    },
  ];
}
