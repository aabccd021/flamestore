// import { FieldIteration } from "../../../type";
// import { addTriggerData, FlamestoreModule, TriggerMap } from "../../type";
// import { getImageMetadatas, isTypeImage } from "../../util";

// export const module: FlamestoreModule = {
// isCreatable: ({ field }) => isTypeDatetime(field),
// isUpdatable: ({ field }) => isTypeDatetime(field),
// isPrimitive: ({ field }) => !isTypeDatetime(field),
// getRule({ fName, field }) {
//   if (isTypeDatetime(field)) {
//     return [`${fName} is datetime`];
//   }
//   return [];
// },
//   triggerGenerator(
//     triggerMap: TriggerMap,
//     { field, colName, fName, col }: FieldIteration
//   ): TriggerMap {
//     if (isTypeImage(field)) {
//       triggerMap[colName].createTrigger = addTriggerData(
//         triggerMap[colName].createTrigger,
//         "snapshotRef",
//         fName,
//         `await imageDataOf(
//           "${colName}",
//           "${fName}",
//           data.${col.ownerField}.reference.id,
//           [${getImageMetadatas(field).map((x) => `"${x}"`)}],
//           snapshot,
//         )`
//       );
//     }
//     return triggerMap;
//   },
// };
