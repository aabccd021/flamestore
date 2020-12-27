import { CollectionIteration, FlamestoreSchema } from "../../type";
import { assertNever, colItersOf } from "../util";
import { TriggerType } from "./type";

const foundDuplicateString = "foundDuplicate";
const functionsString = "functions";
const incrementString = "increment";
const serverTimestampString = "serverTimestamp";
const syncFieldString = "syncField";
const allSettledString = "allSettled";
const updateString = "update";
const imageDataOfString = "imageDataOf";
const thisDataNameString = "snapshotRef";

export function updateThisData(suffix: DataSuffix): string {
  return _updateData(`snapshot${suffix}.ref`, thisDataNameString);
}
export function updateData(dataType: DataName, dataName: string): string {
  return _updateData(`${dataType}.${dataName}.reference`, dataName);
}

function _updateData(reference: string, dataName: string): string {
  return `${updateString}(${reference}, ${dataString(dataName)})`;
}

export function dataString(dataName: string): string {
  return `${dataName}Data`;
}
export function snapshotString(dataName: string): string {
  return `${dataName}Snapshot`;
}

export const utilImports = `
  import {
  ${foundDuplicateString},
  ${functionsString},
  ${incrementString},
  ${serverTimestampString},
  ${syncFieldString},
  ${allSettledString},
  ${updateString},
  ${imageDataOfString},
  } from '../utils';`;

type DataName = "after" | "data";
export function dataNameOfTriggerType(triggerType: TriggerType): DataName {
  if (triggerType === "Create") return "data";
  if (triggerType === "Delete") return "data";
  if (triggerType === "Update") return "after";
  assertNever(triggerType);
}

type DataSuffix = ".after" | "";
export function dataSuffixOfTriggerType(triggerType: TriggerType): DataSuffix {
  if (triggerType === "Create") return "";
  if (triggerType === "Delete") return "";
  if (triggerType === "Update") return ".after";
  assertNever(triggerType);
}

export function triggerPrepareString({
  triggerType,
  pascalColName,
}: {
  triggerType: TriggerType;
  pascalColName: string;
}): string {
  if (triggerType === "Create" || triggerType === "Delete") {
    return `const data = snapshot.data() as ${pascalColName};`;
  }
  if (triggerType === "Update") {
    return `const before = snapshot.before.data() as ${pascalColName};
            const after = snapshot.after.data() as ${pascalColName};`;
  }
  assertNever(triggerType);
}

export function getBatchCommitString({
  commits,
}: {
  commits: string[];
}): string {
  if (commits.length === 0) return "";
  if (commits.length === 1) return `await ${commits[0]};`;
  return `await ${allSettledString}([${commits.join(",")}]);`;
}

export function thisDataAssignment({
  fields,
}: {
  fields: { fName: string; fValue: string }[];
}): string {
  return dataAssignment({ dataName: thisDataNameString, fields });
}

export function dataAssignment({
  dataName,
  fields,
}: {
  dataName: string;
  fields: { fName: string; fValue: string }[];
}): string {
  const dataContent = fields
    .map(({ fName, fValue }) => `${fName}: ${fValue}`)
    .join(",");
  return `const ${dataString(dataName)} = {${dataContent}};`;
}

export function triggerTemplate({
  useContext = false,
  colName,
  triggerType,
  content,
}: {
  useContext?: boolean;
  colName: string;
  triggerType: TriggerType;
  content?: string;
}): string {
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

export function modelImports(schema: FlamestoreSchema): string {
  const modelNames = colItersOf(schema)
    .map(({ pascalColName }) => pascalColName)
    .join(",");
  return `import {${modelNames}} from "../models"`;
}

export function getPromisesString(
  dependencies?: {
    key: string;
    colIter: CollectionIteration;
    promise: string;
  }[]
): string {
  if (!dependencies) return "";
  if (dependencies.length === 0) return "";
  const names = dependencies.map(({ key }) => snapshotString(key)).join();
  const promises = dependencies.map(({ promise }) => promise).join();
  const assignments = dependencies
    .map(
      ({ colIter, key }) =>
        `const ${key} = ${snapshotString(key)}.data() as ${
          colIter.pascalColName
        };`
    )
    .join("\n");
  return `const [${names}] = await Promise.all([${promises}]);${assignments}`;
}
