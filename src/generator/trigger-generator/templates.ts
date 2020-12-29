import _ from "lodash";
import { FlamestoreSchema } from "../../type";
import { assertNever, colsOf, mapPick } from "../util";
import {
  TriggerDependencyIteration,
  FieldTuple,
  TriggerData,
  TriggerType,
} from "./types";

// constants
export const functionsString = "functions";
const foundDuplicateStr = "foundDuplicate";
const incrementStr = "increment";
const imageDataStr = "imageDataOf";
const syncFieldStr = "syncField";
const allSettledStr = "allSettled";
const updateStr = "update";
const serverTimestampStr = "serverTimestamp";

// imports
export const utilImports = `
  import {
  ${foundDuplicateStr},
  ${functionsString},
  ${incrementStr},
  ${serverTimestampStr},
  ${syncFieldStr},
  ${allSettledStr},
  ${updateStr},
  ${imageDataStr},
  } from '../utils';`;
export function getModelImportsStr(schema: FlamestoreSchema): string {
  const modelNames = mapPick(colsOf(schema), "pascalColName");
  return `import {${modelNames}} from "../models"`;
}

// frequently used string
function getDataStr(dataName: string): string {
  return `${dataName}Data`;
}
function getSnapshotStr(dataName: string): string {
  return `${dataName}Snapshot`;
}

// access data
export function getDataFieldStr(fName: string): string {
  return `data.${fName}`;
}
export function toPromiseStr(fName: string): string {
  return `data.${fName}.reference.get()`;
}
export function getOwnerRefIdStr({ ownerField }: { ownerField: string }) {
  return `data.${ownerField}.reference.id`;
}

// update data
export function getUpdateUpdatedDataStr(
  snapshotDataName: SnapshotDataName,
  dataName: string
): string {
  const dataStr = getDataStr(dataName);
  const referenceStr = `${snapshotDataName}.${dataName}.reference`;
  return `${updateStr}(${referenceStr}, ${dataStr})`;
}
export function getDocDataCommits(param: {
  singularColName: string;
  suffix: DataSuffix;
  docData: FieldTuple[];
}): string[] {
  const { suffix, docData, singularColName } = param;
  if (docData.length === 0) return [];
  const dataName = getDataStr(singularColName);
  return [`${updateStr}(snapshot${suffix}.ref, ${dataName})`];
}

// special strings
type SnapshotDataName = "after" | "data";
export function snapshotStrOf(triggerType: TriggerType): SnapshotDataName {
  if (triggerType === "Create") return "data";
  if (triggerType === "Delete") return "data";
  if (triggerType === "Update") return "after";
  assertNever(triggerType);
}
type DataSuffix = ".after" | "";
export function suffixStrOfType(triggerType: TriggerType): DataSuffix {
  if (triggerType === "Create") return "";
  if (triggerType === "Delete") return "";
  if (triggerType === "Update") return ".after";
  assertNever(triggerType);
}

// prepare trigger
export function getTriggerPrepareStr(param: {
  triggerType: TriggerType;
  pascalColName: string;
  useDocData: boolean;
}): string {
  const { triggerType, pascalColName, useDocData } = param;
  if (!useDocData) return "";
  if (triggerType === "Create" || triggerType === "Delete") {
    return `const data = snapshot.data() as ${pascalColName};`;
  }
  if (triggerType === "Update") {
    return `const before = snapshot.before.data() as ${pascalColName};
            const after = snapshot.after.data() as ${pascalColName};`;
  }
  assertNever(triggerType);
}

// batch commit
export function getBatchCommitStr(commits: string[]): string {
  if (commits.length === 0) return "";
  if (commits.length === 1) return `await ${commits[0]};`;
  return `await ${allSettledStr}([${commits}]);`;
}

// assign data
export function getDocDataAssignStr(param: {
  singularColName: string;
  docData: FieldTuple[];
}): string {
  const { singularColName, docData } = param;
  if (docData.length === 0) return "";
  const dataContent = docData.map(({ fName, value }) => `${fName}: ${value}`);
  const dataName = getDataStr(singularColName);
  return `const ${dataName} = {${dataContent}};`;
}
export function toNonUpdatedDataAssignStr(triggerData: TriggerData): string {
  const { field, dataName } = triggerData;
  const dataContent = _([field])
    .flatMap()
    .map(({ fName, value }) => `${fName}: ${value}`);
  return `const ${dataName} = {${dataContent}};`;
}
export function toUpdatedDataAssignStr(triggerData: TriggerData): string {
  const { field, dataName } = triggerData;
  const dataContent = _([field])
    .flatMap()
    .map(({ fName, value }) => `${fName}: ${value}`);
  return `const ${getDataStr(dataName)} = {${dataContent}};`;
}

// trigger
export function getTriggerFunctionStr(param: {
  useContext: boolean;
  colName: string;
  triggerType: TriggerType;
  triggerContentStr: string;
}): string {
  const { useContext, colName, triggerType, triggerContentStr } = param;
  const context = useContext ? ", context" : "";
  return `
    export const on${triggerType} = ${functionsString}.firestore
    .document('/${colName}/{documentId}')
    .on${triggerType}(async (snapshot${context})=>{
      ${triggerContentStr}
    });
  `;
}

// promise
export function getPromiseCallStr(
  dependencies: TriggerDependencyIteration[]
): string {
  if (dependencies.length === 0) return "";
  const names = dependencies.map(({ key }) => getSnapshotStr(key));
  const promises = mapPick(dependencies, "fName").map(toPromiseStr);
  const assignments = dependencies
    .map(({ colIter, key }) => {
      const { pascalColName } = colIter;
      const snapshotStr = getSnapshotStr(key);
      return `const ${key} = ${snapshotStr}.data() as ${pascalColName};`;
    })
    .join("");
  return `const [${names}] = await Promise.all([${promises}]);${assignments}`;
}

// functions
export function getFoundDuplicateStr(
  colName: string,
  fName: string,
  snapshot: string,
  context: string
): string {
  return `${foundDuplicateStr}(${colName},${fName},${snapshot},${context})`;
}
export function getIncrementStr(value: string | number): string {
  return `${incrementStr}(${value})`;
}
export function getSyncFieldStr(
  colName: string,
  fName: string,
  snapshot: string,
  dataName: string
): string {
  return `${syncFieldStr}(${colName},${fName},${snapshot},${dataName})`;
}
export function getImageDataStr(
  colName: string,
  fName: string,
  id: string,
  metadatas: string,
  snapshot: string
): string {
  return `${imageDataStr}(${colName},${fName},${id},${metadatas},${snapshot})`;
}
export function getServerTimestampStr(): string {
  return `${serverTimestampStr}()`;
}
