import * as path from "path";
import * as fs from "fs";
import {
  getNonComputedInterfaceStr,
  getNonComputedFieldStr,
  modelImportsStr,
  toComputedModelStr,
  getFieldRequiredStr,
} from "./model-generator-templates";
import { CollectionEntry } from "../../types";
import { valueOfFieldStr } from "./model-generator-utils";

export function generateFirebaseModel(
  outputFilePath: string,
  collections: CollectionEntry[]
): void {
  const computedModelStr = collections.map(toComputedModelStr).join("");
  const nonComputedModelStr = collections
    .map(({ colName, col }) => {
      const modelContentStr = col.fields
        .map(({ field, fName }) => {
          const fieldRequiredStr = getFieldRequiredStr(field);
          const fieldValueStr = valueOfFieldStr(field);
          return getNonComputedFieldStr({
            fieldRequiredStr,
            fieldValueStr,
            fName,
          });
        })
        .join("");
      return getNonComputedInterfaceStr({ colName, modelContentStr });
    })
    .join("\n\n");
  const modelFileStr = [
    modelImportsStr,
    nonComputedModelStr,
    computedModelStr,
  ].join("\n\n");
  const fileName = path.join(outputFilePath, "models.ts");
  fs.writeFileSync(fileName, modelFileStr);
}
