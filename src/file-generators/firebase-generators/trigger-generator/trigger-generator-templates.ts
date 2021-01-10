import { assertNever } from "../../../utils";
import { CollectionEntry, ColOwnerField } from "../../generator-types";
import {
  mapPick,
  t,
  toPascalColName,
  toSingularColName,
} from "../../generator-utils";
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
export const utilImports = t`
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
  const names = mapPick(colEntries, "colName").map(toPascalColName).join();
  return t`import {${names}} from "../models"`;
}

// frequently used string
function getDataStr(dataName: string): string {
  return t`${dataName}Data`;
}
function getSnapshotStr(dataName: string): string {
  return t`${dataName}Snapshot`;
}

// access data
export function getDataFieldStr({ fName }: { fName: string }): string {
  return t`data.${fName}`;
}
export function toPromiseStr({ fName }: { fName: string }): string {
  return t`data.${fName}.reference.get()`;
}
export function getOwnerRefIdStr(ownerField: ColOwnerField) {
  const { type, name } = ownerField;
  if (type === "reference") return t`data.${name}.reference.id`;
  if (type === "string") return t`data.${name}`;
  assertNever(type);
}

// update data
export function getUpdateUpdatedDataStr(
  snapshotDataName: SnapshotDataName,
  dataName: string
): string {
  const dataStr = getDataStr(dataName);
  const referenceStr = t`${snapshotDataName}.${dataName}.reference`;
  return t`${updateStr}(${referenceStr}, ${dataStr})`;
}
export function getDocDataCommits(param: {
  colName: string;
  suffix: DataSuffix;
  docData: _.Collection<FieldTuple>;
}): string[] {
  const { suffix, docData, colName } = param;
  if (docData.isEmpty()) return [];
  const dataName = getDataStr(toSingularColName(colName));
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
  const pascalColName = toPascalColName(colName);
  if (!useDocData) return "";
  if (triggerType === "Create" || triggerType === "Delete") {
    return t`const data = snapshot.data() as ${pascalColName};`;
  }
  if (triggerType === "Update") {
    return t`const before = snapshot.before.data() as ${pascalColName};
             const after = snapshot.after.data() as ${pascalColName};`;
  }
  assertNever(triggerType);
}

// batch commit
export function getBatchCommitStr(commits: string[]): string {
  if (commits.length === 0) return "";
  if (commits.length === 1) return t`await ${commits[0]};`;
  const commitsStr = commits.join();
  return t`await ${allSettledStr}([${commitsStr}]);`;
}

// assign data
export function getDocDataAssignStr(param: {
  colName: string;
  docData: _.Collection<FieldTuple>;
}): string {
  const { colName, docData } = param;
  if (docData.isEmpty()) return "";
  const dataContent = docData.map(fieldToAssignmentStr).join();
  const dataName = getDataStr(toSingularColName(colName));
  return t`const ${dataName} = {${dataContent}};`;
}
export function toNonUpdatedDataAssignStr(triggerData: TriggerData): string {
  const { fields, dataName } = triggerData;
  const dataContent = fields.map(fieldToAssignmentStr).join();
  return t`const ${dataName} = {${dataContent}};`;
}
export function toUpdatedDataAssignStr(triggerData: TriggerData): string {
  const { fields, dataName } = triggerData;
  const dataContent = fields.map(fieldToAssignmentStr).join();
  const dataStr = getDataStr(dataName);
  return t`const ${dataStr} = {${dataContent}};`;
}
function fieldToAssignmentStr(param: {
  fName: string;
  fValue: string;
}): string {
  const { fName, fValue } = param;
  return t`${fName}: ${fValue}`;
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
  return t`
    export const on${triggerType} = ${functionsString}.firestore
    .document('/${colName}/{documentId}')
    .on${triggerType}(async (snapshot${context})=>{
      ${triggerContentStr}
    });`;
}

// promise
export function getPromiseCallStr(
  dependencies: _.Collection<TriggerDependency>
): string {
  if (dependencies.isEmpty()) return "";
  const names = mapPick(dependencies, "key").map(getSnapshotStr).join();
  const promises = dependencies.map(toPromiseStr).join();
  const assignments = dependencies.map(dependencyToPromiseAssignmentStr);
  return t`const [${names}] = await Promise.all([${promises}]);${assignments}`;
}
function dependencyToPromiseAssignmentStr(param: {
  colName: string;
  key: string;
}): string {
  const { colName, key } = param;
  const pascalColName = toPascalColName(colName);
  const snapshotStr = getSnapshotStr(key);
  return t`const ${key} = ${snapshotStr}.data() as ${pascalColName};`;
}

// functions
export function getFoundDuplicateStr(
  colName: string,
  fName: string,
  snapshot: string,
  context: string
): string {
  return t`${foundDuplicateStr}(${colName},${fName},${snapshot},${context})`;
}
export function getIncrementStr(value: string | number): string {
  return t`${incrementStr}(${value})`;
}
export function getSyncFieldStr(
  colName: string,
  fName: string,
  snapshot: string,
  dataName: string
): string {
  return t`${syncFieldStr}(${colName},${fName},${snapshot},${dataName})`;
}
export function getImageDataStr(
  colName: string,
  fName: string,
  id: string,
  metadatas: string,
  snapshot: string
): string {
  return t`${imageDataStr}(${colName},${fName},${id},${metadatas},${snapshot})`;
}
export function getServerTimestampStr(): string {
  return t`${serverTimestampStr}()`;
}

// index file exports
export function toIndexFileExportStr(colName: string): string {
  return t`export * as ${colName} from "./${colName}";`;
}
