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
  toIndexExportStr,
  utilImports,
} from "./trigger-generator-templates";
import { CollectionEntry } from "../../generator-types";
import { fieldColEntriesOf, mapPick, t } from "../../generator-utils";

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
    const triggerStr = triggerTypes.map((triggerType) => {
      const filteredTriggers = filterTrigger(triggers, colName, triggerType);
      const processedTrigger = processTriggers(filteredTriggers);
      return getTriggerStr({ triggerType, processedTrigger, colName });
    });
    const modelImportsStr = getModelImportsStr(colEntries);
    const triggerFileStr = t`${modelImportsStr}${utilImports}\n\n${triggerStr}`;
    // write
    fs.writeFileSync(path.join(triggerDir, t`${colName}.ts`), triggerFileStr);
  });
  const indexContent = mapPick(colEntries, "colName").map(toIndexExportStr);
  fs.writeFileSync(path.join(triggerDir, t`index.ts`), t`${indexContent}`);
}
