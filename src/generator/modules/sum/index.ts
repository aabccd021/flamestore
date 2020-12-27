// import _ from "lodash";
// import { FlamestoreSchema, FieldIteration } from "../../../type";
// import { addTriggerData, FlamestoreModule, TriggerMap } from "../../type";
// import {
//   assertCollectionNameExists,
//   assertFieldHasTypeOf,
//   isTypeSum,
// } from "../../util";

// export const module: FlamestoreModule = {
//   validate,
//   triggerGenerator,
// };

// function validate(schema: FlamestoreSchema): void {
//   for (const [colName, collection] of _.entries(schema.collections)) {
//     for (const [fName, field] of _.entries(collection.fields)) {
//       if (isTypeSum(field)) {
//         const stackTrace = `collections.${colName}.${fName}.sum`;
//         assertCollectionNameExists(
//           field.collection,
//           schema,
//           `${stackTrace}.collection`
//         );
//         assertFieldHasTypeOf(
//           field.collection,
//           field.reference,
//           "path",
//           schema,
//           `${stackTrace}.reference`
//         );
//         assertFieldHasTypeOf(
//           field.collection,
//           field.field,
//           "int",
//           schema,
//           `${stackTrace}.field`
//         );
//       }
//     }
//   }
// }

// function triggerGenerator(
//   triggerMap: TriggerMap,
//   { colName, field, fName }: FieldIteration
// ): TriggerMap {
//   if (isTypeSum(field)) {
//     const targetRef = field.reference;
//     const incrementField = field.field;

//     triggerMap[colName].createTrigger = addTriggerData(
//       triggerMap[colName].createTrigger,
//       "snapshotRef",
//       fName,
//       "0"
//     );

//     triggerMap[field.collection].createTrigger = addTriggerData(
//       triggerMap[field.collection].createTrigger,
//       targetRef,
//       fName,
//       `increment(data.${incrementField})`
//     );

//     triggerMap[field.collection].updateTrigger = addTriggerData(
//       triggerMap[field.collection].updateTrigger,
//       targetRef,
//       fName,
//       `before.${incrementField} !== after.${incrementField} ?` +
//         `increment(after.${incrementField} - before.${incrementField}) : null`
//     );

//     triggerMap[field.collection].deleteTrigger = addTriggerData(
//       triggerMap[field.collection].deleteTrigger,
//       targetRef,
//       fName,
//       `increment(-data.${incrementField})`
//     );
//   }
//   return triggerMap;
// }
