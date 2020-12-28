import { FieldIteration, ReferenceField } from "../../../type";
import { colIterOf, getSyncFields } from "../../util";
import { syncFieldStr } from "../constants";
import { promiseT } from "../templates";
import { Trigger } from "../type";

export function pathTriggerGenerator(
  field: ReferenceField,
  fIter: FieldIteration
): Trigger[] {
  const { pascalFName, fName, colName, schema, singularColName } = fIter;
  const syncFields = getSyncFields(field, schema);
  if (syncFields.length === 0) return [];

  const {
    pascalColName: pascalColNameToSyncFrom,
    colName: colNameToSyncFrom,
  } = colIterOf(field.collection, schema);
  const refDataStr = `${singularColName}${pascalColNameToSyncFrom}Data`;
  const onCreateData = syncFields.map(
    ({ fName }) => `${fName}:${refDataStr}.${fName}`
  );
  const onUpdateData = syncFields.map(
    ({ fName }) =>
      `${fName}: before.${fName} !== after.${fName} ? after.${fName}: null`
  );
  const dataName = `${colName}${pascalFName}Data`;
  return [
    {
      colName,
      triggerType: "Create",
      thisData: {
        fName,
        fValue: `{${onCreateData}}`,
      },
      dependencies: {
        key: refDataStr,
        promise: promiseT(fName),
        colName: colNameToSyncFrom,
      },
    },
    {
      colName: colNameToSyncFrom,
      triggerType: "Update",
      useThisData: true,
      nonUpdateData: {
        dataName,
        fields: [{ fName, fValue: `{${onUpdateData}}` }],
      },
      resultPromises: `${syncFieldStr}('${colName}','${fName}',snapshot,${dataName})`,
    },
  ];
}
