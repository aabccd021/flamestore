import * as path from "path";
import * as fs from "fs";
import {
  getNonComputedInterfaceStr,
  modelImportsStr,
  toComputedModelStr,
} from "./model-generator-templates";
import { CollectionEntry } from "../../generator-types";
import { t } from "../../generator-utils";
import _ from "lodash";

export function generateFirebaseModel(
  outputFilePath: string,
  cols: CollectionEntry[]
): void {
  const nonComputedStr = _(cols).map(getNonComputedInterfaceStr).join("\n\n");
  const computedStr = _(cols).map(toComputedModelStr).compact();
  const modelFileStr = t`${modelImportsStr}\n\n${nonComputedStr}\n\n${computedStr}\n\n`;
  const fileName = path.join(outputFilePath, "models.ts");
  fs.writeFileSync(fileName, modelFileStr);
}
