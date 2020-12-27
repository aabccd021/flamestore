// import _ from "lodash";
// import { FlamestoreSchema, FieldIteration } from "../../../type";
// import { addTriggerData, FlamestoreModule, TriggerMap } from "../../type";
// import {
//   assertCollectionNameExists,
//   assertFieldHasTypeOf,
//   isTypeCount,
// } from "../../util";

// export const module: FlamestoreModule = {
// };

// function triggerGenerator(
//   triggerMap: TriggerMap,
//   { field, fName, colName }: FieldIteration
// ): TriggerMap {
//   if (isTypeCount(field)) {
//     const targetRef = field.reference;
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
//       "increment(1)"
//     );
//     triggerMap[field.collection].deleteTrigger = addTriggerData(
//       triggerMap[field.collection].deleteTrigger,
//       targetRef,
//       fName,
//       "increment(-1)"
//     );
//   }
//   return triggerMap;
// }
