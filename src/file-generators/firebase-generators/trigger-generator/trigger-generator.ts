import * as path from "path";
import * as fs from "fs";
import { triggerTypes } from "./trigger-generator-types";
import {
  dataOfTriggers as processTriggers,
  filterTrigger,
  getTriggerStr,
  fcEntryToTriggers,
} from "./trigger-generator-utils";
import {
  getModelImportsStr,
  toIndexFileExportStr,
  utilImports,
} from "./trigger-generator-templates";
import { CollectionEntry } from "../../generator-types";
import { fieldColEntriesOf } from "../../generator-utils";
import { mapPick } from "../../../lodash-utils";

export function generateFirebaseTrigger(
  outputFilePath: string,
  colEntries: CollectionEntry[]
): void {
  const triggerDir = path.join(outputFilePath, "flamestore");
  if (!fs.existsSync(triggerDir)) fs.mkdirSync(triggerDir);

  // create triggers
  const fcEntries = fieldColEntriesOf(colEntries);
  const triggers = fcEntries.map(fcEntryToTriggers).flatMap();

  colEntries.forEach(({ colName }) => {
    // triggers to string
    const triggerStr = triggerTypes
      .map((triggerType) => {
        const filteredTriggers = filterTrigger(triggers, colName, triggerType);
        const processedTrigger = processTriggers(filteredTriggers);
        return getTriggerStr({ triggerType, processedTrigger, colName });
      })
      .join("");
    const modelImportsStr = getModelImportsStr(colEntries);
    const triggerFileStr = `${modelImportsStr}${utilImports}\n${triggerStr}`;

    fs.writeFileSync(path.join(triggerDir, `${colName}.ts`), triggerFileStr);
  });
  const indexFileContent = mapPick(colEntries, "colName")
    .map(toIndexFileExportStr)
    .join("");
  fs.writeFileSync(path.join(triggerDir, `index.ts`), indexFileContent);
}