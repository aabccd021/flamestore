import _ from "lodash";
import { PathField } from "../../../type";
import { toSingularColName } from "../../utils";
import { getSyncFieldStr } from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getPathTrigger(
  field: PathField,
  { fName, colName }: { fName: string; colName: string }
): Trigger[] {
  if (!field.syncField) return [];
  const syncFields = _.flatMap([field.syncField]);
  if (syncFields.length === 0) return [];

  //
  const pascalFName = _.upperFirst(fName);
  const singularColName = toSingularColName(colName);
  const colNameToSyncFrom = field.collection;
  const refDataStr = `${singularColName}${pascalFName}Data`;
  const onCreateData = syncFields.map((f) => `${f}:${refDataStr}.${f}`);
  // TODO: change "!==" depends on type, use isEqual for timestamp and reference
  const onUpdateData = syncFields.map(
    (f) => `${f}: before.${f} !== after.${f} ? after.${f}: null`
  );
  const dataName = `${colName}${pascalFName}Data`;

  return [
    {
      colName,
      type: "Create",
      docData: { fName, value: `{${onCreateData}}` },
      dependency: { key: refDataStr, fName, colName: colNameToSyncFrom },
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
