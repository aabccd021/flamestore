import { FieldIteration, ReferenceField } from "../../../type";
import { colIterOf, getSyncFields } from "../../util";
import { getSyncFieldStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getPathTrigger(
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

  return [
    {
      colName,
      type: "Create",
      docData: { fName, value: `{${onCreateData}}` },
      dependency: {
        key: refDataStr,
        fName,
        colName: colNameToSyncFrom,
      },
    },
    {
      colName: colNameToSyncFrom,
      type: "Update",
      useDocData: true,
      nonUpdatedData: {
        dataName,
        field: { fName, value: `{${onUpdateData}}` },
      },
      resultPromise: getSyncFieldStr(
        `'${colName}'`,
        `'${fName}'`,
        `snapshot`,
        dataName
      ),
    },
  ];
}
