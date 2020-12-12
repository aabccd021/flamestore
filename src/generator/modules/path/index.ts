import {
  Collection,
  Field,
  FieldTypes,
  FlamestoreModule,
  TriggerMap,
} from "../../../type";
import { getPascalCollectionName, isTypeReference } from "../../util";

export const module: FlamestoreModule = {
  getRule,
  isCreatable: (field) => isTypeReference(field),
  triggerGenerator,
};

function getRule(fieldName: string, field: Field): string[] {
  const rules: string[] = [];
  if (isTypeReference(field)) {
    rules.push(`${fieldName} is ${FieldTypes.MAP}`);
    rules.push(`${fieldName}.keys() == ['reference']`);
    rules.push(`${fieldName}.reference is path`);
    rules.push(`exists(${fieldName}.reference)`);
  }
  return rules;
}

function triggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  __: Collection,
  fieldName: string,
  field: Field
): TriggerMap {
  if (isTypeReference(field) && field.syncFields) {
    const colNameToSyncFrom = field.collection;
    field.syncFields.forEach((syncFieldName) => {
      triggerMap[collectionName].createTrigger.dependencyPromises[
        `ref${colNameToSyncFrom}Data`
      ] = {
        promise: `data.${fieldName}.reference.get()`,
        collection: colNameToSyncFrom,
      };

      triggerMap[collectionName].createTrigger.addData(
        "snapshotRef",
        `${fieldName}.${syncFieldName}`,
        `ref${colNameToSyncFrom}Data.${syncFieldName}`
      );

      triggerMap[colNameToSyncFrom].updateTrigger.addNonUpdateData(
        `${collectionName}${getPascalCollectionName(fieldName)}`,
        `${fieldName}.${syncFieldName}`,
        `after.${syncFieldName}`,
        `after.${syncFieldName} !== before.${syncFieldName}`
      );

      triggerMap[colNameToSyncFrom].updateTrigger.addResultPromise(
        `syncField(
        '${collectionName}',
        '${fieldName}',
        change.after.ref,
        ${collectionName}${getPascalCollectionName(field.collection)}Data
        )`
      );
    });
  }
  return triggerMap;
}
