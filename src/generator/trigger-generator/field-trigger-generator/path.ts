import { FieldIteration, ReferenceField } from "../../../type";
import { getSyncFields } from "../../util";
import { Trigger } from "../type";

export function pathTriggerGenerator(
  field: ReferenceField,
  fIter: FieldIteration
): Trigger[] {
  const { pascalFName, fName, colName, schema } = fIter;
  const syncFields = getSyncFields(field, schema);
  if (syncFields.length === 0) return [];
  const colNameToSyncFrom = field.collection;
  const createAssignment = syncFields.map(
    ({ fName }) => `${fName}: ref${colNameToSyncFrom}Data.${fName}`
  );

  const updateAssignment = syncFields
    .map(
      ({ fName }) =>
        `${fName}: after.${fName} !== before.${fName} ?after.${fName}: null`
    )
    .join(",\n");
  return [
    {
      colName,
      triggerType: "Create",
      thisData: [
        {
          fName,
          fValue: `{${createAssignment}}`,
        },
      ],
      dependencies: [
        {
          key: `ref${colNameToSyncFrom}Data`,
          promise: `data.${fName}.reference.get()`,
          colName: colNameToSyncFrom,
        },
      ],
    },
    {
      colName: colNameToSyncFrom,
      triggerType: "Update",
      useThisData: true,
      nonUpdateData: [
        {
          dataName: `${colName}${pascalFName}`,
          fName,
          fValue: `{${updateAssignment}}`,
        },
      ],
      resultPromises: [
        `syncField('${colName}','${fName}',snapshot,${colName}${pascalFName}Data)`,
      ],
    },
  ];
}
