// import * as fs from "fs";
// import _ from "lodash";
// import * as path from "path";
// import { CollectionIteration, FlamestoreSchema } from "../type";
// import {
//   FlamestoreModule,
//   TriggerMap,
//   CollectionTriggerMap,
//   TriggerData,
//   getEmptyCollectionTriggerMap,
//   isTriggerDataEmpty,
// } from "./type";
// import { colIterOf, colItersOf, fItersOf } from "./util";

// import _ from "lodash";
// import { CollectionIteration } from "../type";
// import { ColTriggerMap, Trigger } from "./type";

// export default function generate(
//   outputFilePath: string,
//   schema: FlamestoreSchema,
//   modules: FlamestoreModule[]
// ): void {
//   let triggerMap: TriggerMap = {};
//   colItersOf(schema).forEach(({ colName }) => {
//     triggerMap[colName] = getEmptyCollectionTriggerMap();
//   });
//   _(modules)
//     .map((module) => module.triggerGenerator)
//     .compact()
//     .forEach((triggerGenerator) => {
//       colItersOf(schema).forEach((colIter) =>
//         fItersOf(colIter).forEach((fIter) => {
//           triggerMap = triggerGenerator(triggerMap, fIter);
//         })
//       );
//     });
//   const triggerDir = path.join(outputFilePath, "flamestore");
//   _(triggerMap).forEach((colTriggerMap, colName) => {
//     const colIter = colIterOf(colName, schema);
//     const colString = stringOfCollectionTrigger(colIter, colTriggerMap);
//     const triggerContent = triggerContentOf(schema, colString);
//     if (!fs.existsSync(triggerDir)) fs.mkdirSync(triggerDir);
//     fs.writeFileSync(path.join(triggerDir, `${colName}.ts`), triggerContent);
//   });

//   const indexFileContent = colItersOf(schema)
//     .map(({ colName }) => `export * as ${colName} from "./${colName}";`)
//     .join("\n");
//   fs.writeFileSync(path.join(triggerDir, "index.ts"), indexFileContent);
// }

// const triggerContentOf = (schema: FlamestoreSchema, colString: string) => {
//   const modelNames = colItersOf(schema)
//     .map(({ pascalColName }) => pascalColName)
//     .join(",");
//   return `
// import {${modelNames}} from "../models"
// import {foundDuplicate,
// functions,
// increment,
// serverTimestamp,
// syncField,
// allSettled,
// update,
// imageDataOf,
// } from '../utils';

// ${colString}
// `;
// };

// triggerType,
// collectionName,
// refTriggerData,
// prepareTrigger,
// function stringOfCollectionTrigger(
//   { colName, pascalColName }: CollectionIteration,
//   colTriggerMap: ColTriggerMap
// ): string {
//   return [
//     triggerTemplate({
//       triggerType: "Create",
//       colName,
//       refTriggerData: colTriggerMap.create,
//       prepareTrigger: `const data = snapshot.data() as ${pascalColName};`,
//     }),
//     triggerTemplate({
//       triggerType: "Update",
//       colName,
//       refTriggerData: colTriggerMap.update,
//       prepareTrigger: `const before = change.before.data() as ${pascalColName};
//                        const after = change.after.data() as ${pascalColName};`,
//     }),
//     triggerTemplate({
//       triggerType: "Delete",
//       colName,
//       refTriggerData: colTriggerMap.update,
//       prepareTrigger: `const data = snapshot.data() as ${pascalColName};`,
//     }),
//   ].join("");
// }

// function triggerTemplate({
//   triggerType,
//   colName,
//   refTriggerData,
//   prepareTrigger,
// }: {
//   triggerType: TriggerType;
//   colName: string;
//   refTriggerData?: Trigger;
//   prepareTrigger: string;
// }): string {
//   const triggerContent = refTriggerDataToString(refTriggerData);
//   const dependencyPromises = dependencyPromisesToString(refTriggerData);
//   const batchCommit = refTriggerDataToBatchCommitString(
//     refTriggerData,
//     triggerType
//   );

//   const finalPrepareTrigger =
//     _.keys(refTriggerData.data).filter((e) => e !== "snapshotRef").length ===
//       0 && triggerType === "Create"
//       ? ""
//       : prepareTrigger;

//   const firstParam = triggerType === "Update" ? "change" : "snapshot";
//   const context = refTriggerData.useContext ? ", context" : "";
//   return `
//   export const on${triggerType} = functions.firestore
//   .document('/${colName}/{documentId}')
//   .on${triggerType}(async (${firstParam}${context})=>{
//     ${finalPrepareTrigger};
//     ${refTriggerData.header};
//     ${dependencyPromises};
//     ${triggerContent};
//     ${batchCommit}
//   });
//   `;
// }

// function dependencyPromisesToString(triggerData: TriggerData) {
//   if (_.isEmpty(triggerData.dependencyPromises)) {
//     return "";
//   }
//   const dependencyNames = _(triggerData.dependencyPromises)
//     .keys()
//     .map((d) => `${d}Snapshot`)
//     .join();
//   const dependencyPromises = _(triggerData.dependencyPromises)
//     .map((d) => `${d.promise}`)
//     .join();
//   const dependencyAssignment = _(triggerData.dependencyPromises)
//     .map(
//       ({ colName }, dName) =>
//         `const ${dName} = ${dName}Snapshot.data() as ${colName};`
//     )
//     .join("\n");
//   return `const [${dependencyNames}] = await Promise.all([${dependencyPromises}]);${dependencyAssignment}`;
// }

// function refTriggerDataToString(triggerData: TriggerData) {
//   const data = _(triggerData.data)
//     .map((refTrigger, refName) => {
//       const x = _(refTrigger)
//         .map(({ fieldValue }, fieldName) => `${fieldName}: ${fieldValue}`)
//         .join(",");
//       return `const ${refName}Data= {${x}};`;
//     })
//     .join("\n");
//   const nonUpdateData = _(triggerData.nonUpdateData)
//     .map((refTrigger, refName) => {
//       const x = _(refTrigger)
//         .map(({ fieldValue }, fieldName) => `${fieldName}: ${fieldValue}`)
//         .join(",");
//       return `const ${refName}Data= {${x}};`;
//     })
//     .join("\n");
//   return data + nonUpdateData;
// }

// function refTriggerDataToBatchCommitString(
//   triggerData: TriggerData,
//   triggerType: TriggerType
// ) {
//   const dataName = triggerType === "Update" ? "after" : "data";
//   const post = triggerType === "Update" ? ".after" : "";
//   const content = _.entries(triggerData.data)
//     .filter(([_, refTrigger]) => refTrigger !== {})
//     .map(([refName, _]) => {
//       const setName =
//         refName === "snapshotRef"
//           ? `snapshot${post}.ref`
//           : `${dataName}.${refName}.reference`;
//       return `update(${setName},${refName}Data)`;
//     });
//   const batchCommit = [...content, ...triggerData.resultPromises];
//   if (batchCommit.length === 1) {
//     return `await ${batchCommit[0]};`;
//   }
//   return `await allSettled([
//        ${batchCommit.join(",")}
//   ]);`;
// }
