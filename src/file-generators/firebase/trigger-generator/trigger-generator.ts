import * as path from "path";
import * as fs from "fs";
import { FlamestoreSchema } from "../../../type";
import { colsOf, fieldsOfSchema, mapPick } from "../../utils";
import { triggerTypes } from "./trigger-generator-types";
import {
  dataOfTriggers as processTriggers,
  filterTrigger,
  getTriggerStr,
  toTriggers as fieldToTriggers,
} from "./trigger-generator-utils";
import {
  getModelImportsStr,
  toIndexFileExportStr,
  utilImports,
} from "./trigger-generator-templates";

export function generateFirebaseTrigger(
  outputFilePath: string,
  schema: FlamestoreSchema
): void {
  // create dir
  const triggerDir = path.join(outputFilePath, "flamestore");
  if (!fs.existsSync(triggerDir)) fs.mkdirSync(triggerDir);

  // create triggers
  const triggers = fieldsOfSchema(schema).map(fieldToTriggers).flatMap();

  const collections = colsOf(schema);
  // generate triggers
  collections.forEach(({ colName }) => {
    // triggers to string
    const triggerStr = triggerTypes
      .map((triggerType) => {
        const filteredTriggers = filterTrigger(triggers, colName, triggerType);
        const processedTrigger = processTriggers(filteredTriggers);
        return getTriggerStr({ triggerType, processedTrigger, colName });
      })
      .join("");
    const modelImportsStr = getModelImportsStr(schema);
    const triggerFileStr = `${modelImportsStr}${utilImports}\n${triggerStr}`;

    // write collection trigger
    fs.writeFileSync(path.join(triggerDir, `${colName}.ts`), triggerFileStr);
  });
  const indexFileContent = mapPick(collections, "colName")
    .map(toIndexFileExportStr)
    .join("");
  fs.writeFileSync(path.join(triggerDir, `index.ts`), indexFileContent);
}
