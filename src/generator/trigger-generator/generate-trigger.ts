import * as path from "path";
import * as fs from "fs";
import { FlamestoreSchema } from "../../type";
import { colsOf, fieldsOfSchema } from "../util";
import { triggerTypes } from "./types";
import {
  dataOfTriggers as processTriggers,
  filterTrigger,
  getTriggerStr,
  toTriggers,
} from "./generate-trigger-utils";
import { getModelImportsStr, utilImports } from "./templates";

export default function generateTrigger(
  outputFilePath: string,
  schema: FlamestoreSchema
): void {
  // create dir
  const triggerDir = path.join(outputFilePath, "flamestore");
  if (!fs.existsSync(triggerDir)) fs.mkdirSync(triggerDir);

  // create triggers
  const triggers = fieldsOfSchema(schema).map(toTriggers).flatMap();

  // generate triggers
  colsOf(schema).forEach(({ colName, pascalColName, singularColName }) => {
    const colNames = { colName, pascalColName, singularColName };
    // triggers to string
    const triggerStr = triggerTypes
      .map((triggerType) => {
        console.log(colName);
        console.log(triggerType);
        console.log();
        const filteredTriggers = filterTrigger(triggers, colName, triggerType);
        const processedTrigger = processTriggers(filteredTriggers, schema);
        return getTriggerStr({ triggerType, processedTrigger, ...colNames });
      })
      .join("");
    const modelImportsStr = getModelImportsStr(schema);
    const finalTriggerStr = `${modelImportsStr}${utilImports}\n${triggerStr}`;

    // write out
    fs.writeFileSync(path.join(triggerDir, `${colName}.ts`), finalTriggerStr);
  });
}
