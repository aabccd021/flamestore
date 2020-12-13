import _ from "lodash";
import { FieldIteration } from "../../../type";
import {
  addResultPromise,
  addTriggerData,
  addTriggerNonUpdateData,
  FlamestoreModule,
  TriggerMap,
} from "../../type";
import { getPascalCollectionName, isTypeReference } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: ({ field }) => isTypeReference(field),
  getRule({ fName, field }) {
    const rules: string[] = [];
    if (isTypeReference(field)) {
      rules.push(`${fName} is map`);
      rules.push(`${fName}.keys() == ['reference']`);
      rules.push(`${fName}.reference is path`);
      rules.push(`exists(${fName}.reference)`);
    }
    return rules;
  },
  triggerGenerator(
    triggerMap: TriggerMap,
    { fName, field, colName }: FieldIteration
  ) {
    if (isTypeReference(field) && field.syncField) {
      const colNameToSyncFrom = field.collection;
      triggerMap[colName].createTrigger.dependencyPromises[
        `ref${colNameToSyncFrom}Data`
      ] = {
        promise: `data.${fName}.reference.get()`,
        collection: colNameToSyncFrom,
      };
      triggerMap[colNameToSyncFrom].updateTrigger = addResultPromise(
        triggerMap[colNameToSyncFrom].updateTrigger,
        `syncField(
          '${colName}',
          '${fName}',
          change.after.ref,
          ${colName}${getPascalCollectionName(field.collection)}Data
          )`
      );
      const syncFields = _.flatMap([field.syncField]);
      const createAssignment = syncFields
        .map((f) => `${f}: ref${colNameToSyncFrom}Data.${f}`)
        .join(",\n");
      triggerMap[colName].createTrigger = addTriggerData(
        triggerMap[colName].createTrigger,
        "snapshotRef",
        `${fName}`,
        `{${createAssignment}}`
      );

      const updateAssignment = syncFields
        .map((f) => `${f}: after.${f} !== before.${f} ?after.${f}: null`)
        .join(",\n");
      triggerMap[colNameToSyncFrom].updateTrigger = addTriggerNonUpdateData(
        triggerMap[colNameToSyncFrom].updateTrigger,
        `${colName}${getPascalCollectionName(fName)}`,
        `${fName}`,
        `{${updateAssignment}}`
      );
    }
    return triggerMap;
  },
};
