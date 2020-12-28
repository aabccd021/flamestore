import * as path from "path";
import * as fs from "fs";
import { FlamestoreSchema } from "../../type";
import { colsOf, fieldsOfSchema } from "../util";
import { triggerTypes } from "./type";
import { getTriggerStr, toTrigger } from "./trigger-util";
import { getModelImportsStr, utilImports } from "./templates";

export default function generateTrigger(
  outputFilePath: string,
  schema: FlamestoreSchema
): void {
  // create directory if not exists
  const triggerDir = path.join(outputFilePath, "flamestore");
  if (!fs.existsSync(triggerDir)) fs.mkdirSync(triggerDir);

  // generate triggers
  const triggers = fieldsOfSchema(schema).map(toTrigger).flatMap().value();

  // generate string and write to file for each collections
  colsOf(schema).forEach((colIter) => {
    const { colName } = colIter;

    // generate and merge trigger strings
    const triggerStr = triggerTypes
      .map((triggerType) => getTriggerStr(colIter, triggerType, triggers))
      .join("");
    const colTriggerStr = getModelImportsStr(schema) + utilImports + triggerStr;

    fs.writeFileSync(path.join(triggerDir, `${colName}.ts`), colTriggerStr);
  });
}
