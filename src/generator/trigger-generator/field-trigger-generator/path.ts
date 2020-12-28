import { FieldIteration, ReferenceField } from "../../../type";
import { colIterOf, getSyncFields } from "../../util";
import { syncFieldStr } from "../constants";
import { getPromiseStr } from "../templates";
import { Trigger } from "../type";

export function pathTriggerGenerator(
  field: ReferenceField,
  fIter: FieldIteration
): Trigger[] {
  const { pascalFName, fName, colName, schema, singularColName } = fIter;
  const syncFields = getSyncFields(field, schema);
  if (syncFields.length === 0) return [];

  // get collection name to sync from
  const {
    pascalColName: pascalColNameToSyncFrom,
    colName: colNameToSyncFrom,
  } = colIterOf(field.collection, schema);

  // dataname
  const refDataStr = `${singularColName}${pascalColNameToSyncFrom}Data`;

  // data assignment
  const onCreateData = syncFields.map(
    ({ fName }) => `${fName}:${refDataStr}.${fName}`
  );
  const onUpdateData = syncFields.map(
    ({ fName }) =>
      `${fName}: before.${fName} !== after.${fName} ? after.${fName}: null`
  );

  // sync fields
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
