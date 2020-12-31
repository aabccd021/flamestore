import { mapPick } from "../../../lodash-utils";
import { assertNever, assertString } from "../../../utils";
import { CollectionEntry } from "../../generator-types";
import { toPascalColName, toSingularColName } from "../../generator-utils";
import {
  FieldTuple,
  TriggerData,
  TriggerDependency,
  TriggerType,
} from "./trigger-generator-types";

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
export function getModelImportsStr(colEntries: CollectionEntry[]): string {
  const names: string = mapPick(colEntries, "colName")
    .map(toPascalColName)
    .join(",");
  return `import {${names}} from "../models"`;
}

// frequently used string
function getDataStr(dataName: string): string {
  return `${dataName}Data`;
}
function getSnapshotStr(dataName: string): string {
  return `${dataName}Snapshot`;
}

// access data
export function getDataFieldStr({ fName }: { fName: string }): string {
  return `data.${fName}`;
}
export function toPromiseStr({ fName }: { fName: string }): string {
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
  const dataStr: string = getDataStr(dataName);
  const referenceStr = `${snapshotDataName}.${dataName}.reference`;
  return `${updateStr}(${referenceStr}, ${dataStr})`;
}
export function getDocDataCommits(param: {
  colName: string;
  suffix: DataSuffix;
  docData: FieldTuple[];
}): string[] {
  const { suffix, docData, colName } = param;
  if (docData.length === 0) return [];
  const dataName: string = getDataStr(toSingularColName(colName));
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
  colName: string;
  useDocData: boolean;
}): string {
  const { triggerType, colName, useDocData } = param;
  const pascalColName: string = toPascalColName(colName);
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
  colName: string;
  docData: FieldTuple[];
}): string {
  const { colName, docData } = param;
  if (docData.length === 0) return "";
  const dataContent: string = docData.map(fieldToAssignmentStr).join(",");
  const dataName: string = getDataStr(toSingularColName(colName));
  return `const ${dataName} = {${dataContent}};`;
}
export function toNonUpdatedDataAssignStr(triggerData: TriggerData): string {
  const { fields, dataName } = triggerData;
  assertString(dataName);
  const dataContent: string = fields.map(fieldToAssignmentStr).join(",");
  return `const ${dataName} = {${dataContent}};`;
}
export function toUpdatedDataAssignStr(triggerData: TriggerData): string {
  const { fields, dataName } = triggerData;
  const dataContent: string = fields.map(fieldToAssignmentStr).join(",");
  const dataStr: string = getDataStr(dataName);
  return `const ${dataStr} = {${dataContent}};`;
}
function fieldToAssignmentStr(param: {
  fName: string;
  fValue: string;
}): string {
  const { fName, fValue } = param;
  return `${fName}: ${fValue}`;
}

// trigger
export function getTriggerFunctionStr(param: {
  useContext: boolean;
  colName: string;
  triggerType: TriggerType;
  triggerContentStr: string;
}): string {
  const { useContext, colName, triggerType, triggerContentStr } = param;
  assertString(triggerType);
  const context: string = useContext ? ", context" : "";
  return `
    export const on${triggerType} = ${functionsString}.firestore
    .document('/${colName}/{documentId}')
    .on${triggerType}(async (snapshot${context})=>{
      ${triggerContentStr}
    });
  `;
}

// promise
export function getPromiseCallStr(dependencies: TriggerDependency[]): string {
  if (dependencies.length === 0) return "";
  const names: string = mapPick(dependencies, "key")
    .map(getSnapshotStr)
    .join(",");
  const promises: string = dependencies.map(toPromiseStr).join(",");
  const assignments: string = dependencies
    .map(dependencyToPromiseAssignmentStr)
    .join("");
  return `const [${names}] = await Promise.all([${promises}]);${assignments}`;
}
function dependencyToPromiseAssignmentStr(param: {
  colName: string;
  key: string;
}): string {
  const { colName, key } = param;
  const pascalColName: string = toPascalColName(colName);
  const snapshotStr: string = getSnapshotStr(key);
  return `const ${key} = ${snapshotStr}.data() as ${pascalColName};`;
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

// index file exports
export function toIndexFileExportStr(colName: string): string {
  return `export * as ${colName} from "./${colName}";`;
}
