import { CollectionIteration, FlamestoreSchema } from "../../type";
import { assertNever, colsOf } from "../util";
import {
  incrementStr,
  imageDataStr,
  updateStr,
  foundDuplicateStr,
  serverTimestampStr,
  syncFieldStr,
  allSettledStr,
  functionsString,
} from "./constants";
import { FieldTuple, TriggerData, TriggerType } from "./type";

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
  const modelNames = colsOf(schema)
    .map(({ pascalColName }) => pascalColName)
    .join(",");
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
export function getPromiseStr(fName: string): string {
  return `data.${fName}.reference.get()`;
}
export function getOwnerRefIdStr({ ownerField }: { ownerField: string }) {
  return `data.${ownerField}.reference.id`;
}

// update data
export function getUpdateUpdateDataStr(
  snapshotDataName: SnapshotDataName,
  dataName: string
): string {
  const dataStr = getDataStr(dataName);
  const referenceStr = `${snapshotDataName}.${dataName}.reference`;
  return `${updateStr}(${referenceStr}, ${dataStr})`;
}
export function getUpdateSelfDocDataStr(
  { singularColName }: CollectionIteration,
  suffix: DataSuffix,
  fields: FieldTuple[]
): string[] {
  if (fields.length === 0) return [];
  const dataName = getDataStr(singularColName);
  return [`${updateStr}(snapshot${suffix}.ref, ${dataName})`];
}

// special strings
type SnapshotDataName = "after" | "data";
export function snapshotNameOf(triggerType: TriggerType): SnapshotDataName {
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
  useThisData: boolean;
}): string {
  const { triggerType, pascalColName, useThisData } = param;
  if (!useThisData) return "";
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
export function getBatchCommitStr({ commits }: { commits: string[] }): string {
  if (commits.length === 0) return "";
  if (commits.length === 1) return `await ${commits[0]};`;
  return `await ${allSettledStr}([${commits.join(",")}]);`;
}

// assign data
export function getSelfDocDataAssignStr(
  { singularColName }: CollectionIteration,
  fields: FieldTuple[]
): string {
  if (fields.length === 0) return "";
  const dataContent = fields
    .map(({ fName, fValue }) => `${fName}: ${fValue}`)
    .join(",");
  const dataName = getDataStr(singularColName);
  return `const ${dataName} = {${dataContent}};`;
}
export function toNonUpdateDataAssignStr(triggerData: TriggerData): string {
  const { fields, dataName } = triggerData;
  const dataContent = fields
    .map(({ fName, fValue }) => `${fName}: ${fValue}`)
    .join(",");
  return `const ${dataName} = {${dataContent}};`;
}
export function toUpdateDataAssignStr(triggerData: TriggerData): string {
  const { fields, dataName } = triggerData;
  const dataContent = fields
    .map(({ fName, fValue }) => `${fName}: ${fValue}`)
    .join(",");
  return `const ${getDataStr(dataName)} = {${dataContent}};`;
}

// trigger
export function getTriggerFunctionStr(param: {
  useContext?: boolean;
  colName: string;
  triggerType: TriggerType;
  content?: string;
}): string {
  const { useContext = false, colName, triggerType, content } = param;
  if (!content) return "";
  const context = useContext ? ", context" : "";
  return `
  export const on${triggerType} = ${functionsString}.firestore
  .document('/${colName}/{documentId}')
  .on${triggerType}(async (snapshot${context})=>{
    ${content}
  });
  `;
}

// promise
export function getPromiseCallStr(
  dependencies?: {
    key: string;
    colIter: CollectionIteration;
    promise: string;
  }[]
): string {
  if (!dependencies) return "";
  if (dependencies.length === 0) return "";
  const names = dependencies.map(({ key }) => getSnapshotStr(key)).join();
  const promises = dependencies.map(({ promise }) => promise).join();
  const assignments = dependencies
    .map(({ colIter, key }) => {
      const snapshotStr = getSnapshotStr(key);
      return `const ${key} = ${snapshotStr}.data() as ${colIter.pascalColName};`;
    })
    .join("\n");
  return `const [${names}] = await Promise.all([${promises}]);${assignments}`;
}
