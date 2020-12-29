// import { FieldIteration } from "../../../type";
// import {
//   addResultPromise,
//   addTriggerData,
//   addTriggerNonUpdateData,
//   FlamestoreModule,
//   TriggerMap,
// } from "../../type";
// import { getSyncFields, isTypeReference } from "../../util";

// export const module: FlamestoreModule = {
//   isCreatable: ({ field }) => isTypeReference(field),
//   getRule({ fName, field }) {
//     const rules: string[] = [];
//     if (isTypeReference(field)) {
//       rules.push(`${fName} is map`);
//       rules.push(`${fName}.keys() == ['reference']`);
//       rules.push(`${fName}.reference is path`);
//       rules.push(`exists(${fName}.reference)`);
//     }
//     return rules;
//   },
//   triggerGenerator(triggerMap: TriggerMap, fIter: FieldIteration) {
//     const { pascalFName, fName, field, colName, schema } = fIter;
//     if (isTypeReference(field) && field.syncField) {
//       const colNameToSyncFrom = field.collection;
//       triggerMap[colName].createTrigger.dependencyPromises[
//         `ref${colNameToSyncFrom}Data`
//       ] = {
//         promise: `data.${fName}.reference.get()`,
//         colName: colNameToSyncFrom,
//       };
//       triggerMap[colNameToSyncFrom].updateTrigger = addResultPromise(
//         triggerMap[colNameToSyncFrom].updateTrigger,
//         `syncField(
//           '${colName}',
//           '${fName}',
//           change.after.ref,
//           ${colName}${pascalColName(fName)}Data
//           )`
//       );
//       const syncFields = getSyncFields(field, schema);
//       const createAssignment = syncFields
//         .map(({ fName }) => `${fName}: ref${colNameToSyncFrom}Data.${fName}`)
//         .join(",\n");
//       triggerMap[colName].createTrigger = addTriggerData(
//         triggerMap[colName].createTrigger,
//         "snapshotRef",
//         `${fName}`,
//         ``
//       );

//       const updateAssignment = syncFields
//         .map(
//           ({ fName }) =>
//             `${fName}: after.${fName} !== before.${fName} ?after.${fName}: null`
//         )
//         .join(",\n");
//       triggerMap[colNameToSyncFrom].updateTrigger = addTriggerNonUpdateData(
//         triggerMap[colNameToSyncFrom].updateTrigger,
//         `${colName}${pascalFName}`,
//         `${fName}`,
//         `{${updateAssignment}}`
//       );
//     }
//     return triggerMap;
//   },
// };
