import * as path from "path";
import * as fs from "fs";
import {
  getNonComputedInterfaceStr,
  getNonComputedFieldStr,
  modelImportsStr,
  toComputedModelStr,
  getFieldRequiredStr,
} from "./model-generator-templates";
import { CollectionEntry, FieldEntry } from "../../generator-types";
import { valueOfFieldStr } from "./model-generator-utils";

export function generateFirebaseModel(
  outputFilePath: string,
  cols: CollectionEntry[]
): void {
  const computedModelStr = cols.map(toComputedModelStr).join("");
  const nonComputedModelStr = cols.map(toNonComputedModelStr).join("\n\n");
  const modelFileStrs: string[] = [
    modelImportsStr,
    nonComputedModelStr,
    computedModelStr,
  ];
  const modelFileStr = modelFileStrs.join("\n\n");
  const fileName = path.join(outputFilePath, "models.ts");
  fs.writeFileSync(fileName, modelFileStr);
}

function toNonComputedModelStr({ colName, col }: CollectionEntry): string {
  const modelContentStr = col.fields.map(fieldToNonComputedModelStr);
  return getNonComputedInterfaceStr({ colName, modelContentStr });
}

function fieldToNonComputedModelStr({ field, fName }: FieldEntry): string {
  const fieldRequiredStr = getFieldRequiredStr(field);
  const fieldValueStr = valueOfFieldStr(field);
  const fieldData = { fieldRequiredStr, fieldValueStr, fName };
  return getNonComputedFieldStr(fieldData);
}
