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
} from "./constants";
import { FieldTuple, TriggerData, TriggerType } from "./type";

export const functionsString = "functions";
export function dataFieldT(fName: string): string {
  return `data.${fName}`;
}
export function promiseT(fName: string): string {
  return `data.${fName}.reference.get()`;
}
export function ownerRefIdT({ ownerField }: { ownerField: string }) {
  return `data.${ownerField}.reference.id`;
}

export function imageDataT({
  colName,
  fName,
  id,
  metadatas,
}: {
  colName: string;
  fName: string;
  id: string;
  metadatas: string[];
}): string {
  const metadatasString = metadatas.map((x) => `"${x}"`);
  return (
    `await ${imageDataStr}("${colName}","${fName}",${id},[${metadatasString}]` +
    `,snapshot)`
  );
}

export function updateDataT(
  snapshotDataName: SnapshotDataName,
  dataName: string
): string {
  const dataStr = dataStringT(dataName);
  const referenceStr = `${snapshotDataName}.${dataName}.reference`;
  return `${updateStr}(${referenceStr}, ${dataStr})`;
}

function dataStringT(dataName: string): string {
  return `${dataName}Data`;
}
export function snapshotStringT(dataName: string): string {
  return `${dataName}Snapshot`;
}

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

export function triggerPrepareT({
  triggerType,
  pascalColName,
  useThisData,
}: {
  triggerType: TriggerType;
  pascalColName: string;
  useThisData: boolean;
}): string {
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

export function batchCommitT({ commits }: { commits: string[] }): string {
  if (commits.length === 0) return "";
  if (commits.length === 1) return `await ${commits[0]};`;
  return `await ${allSettledStr}([${commits.join(",")}]);`;
}

export function updateThisDataT(
  { singularColName }: CollectionIteration,
  suffix: DataSuffix,
  fields: FieldTuple[]
): string[] {
  if (fields.length === 0) return [];
  const dataName = dataStringT(singularColName);
  return [`${updateStr}(snapshot${suffix}.ref, ${dataName})`];
}

export function thisDataAssignStrOf(
  { singularColName }: CollectionIteration,
  fields: FieldTuple[]
): string {
  if (fields.length === 0) return "";
  const dataContent = fields
    .map(({ fName, fValue }) => `${fName}: ${fValue}`)
    .join(",");
  const dataName = dataStringT(singularColName);
  return `const ${dataName} = {${dataContent}};`;
}

export function toNonUpdateDataAssignStr(triggerData: TriggerData): string {
  const { fields, dataName } = triggerData;
  const dataContent = fields
    .map(({ fName, fValue }) => `${fName}: ${fValue}`)
    .join(",");
  return `const ${dataName} = {${dataContent}};`;
}

export function toDataAssignStr(triggerData: TriggerData): string {
  const { fields, dataName } = triggerData;
  const dataContent = fields
    .map(({ fName, fValue }) => `${fName}: ${fValue}`)
    .join(",");
  return `const ${dataStringT(dataName)} = {${dataContent}};`;
}

export function triggerT({
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

export function modelImportsT(schema: FlamestoreSchema): string {
  const modelNames = colsOf(schema)
    .map(({ pascalColName }) => pascalColName)
    .join(",");
  return `import {${modelNames}} from "../models"`;
}

export function promisesT(
  dependencies?: {
    key: string;
    colIter: CollectionIteration;
    promise: string;
  }[]
): string {
  if (!dependencies) return "";
  if (dependencies.length === 0) return "";
  const names = dependencies.map(({ key }) => snapshotStringT(key)).join();
  const promises = dependencies.map(({ promise }) => promise).join();
  const assignments = dependencies
    .map(
      ({ colIter, key }) =>
        `const ${key} = ${snapshotStringT(key)}.data() as ${
          colIter.pascalColName
        };`
    )
    .join("\n");
  return `const [${names}] = await Promise.all([${promises}]);${assignments}`;
}
