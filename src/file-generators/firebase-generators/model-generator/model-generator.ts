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
import { t } from "../../generator-utils";
import _ from "lodash";

export function generateFirebaseModel(
  outputFilePath: string,
  cols: CollectionEntry[]
): void {
  const nonComputedModelStr = _(cols).map(toNonComputedModelStr).join("\n\n");
  const computedModelStr = _(cols).map(toComputedModelStr).compact();
  const modelFileStr = t`${modelImportsStr}\n\n${nonComputedModelStr}\n\n${computedModelStr}\n\n`;
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
