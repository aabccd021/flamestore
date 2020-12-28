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
  const triggerDir = path.join(outputFilePath, "flamestore");
  if (!fs.existsSync(triggerDir)) fs.mkdirSync(triggerDir);
  const triggers = fieldsOfSchema(schema).map(toTrigger).flatMap();
  colsOf(schema).forEach((colIter) => {
    const { colName } = colIter;
    const triggerStr = triggerTypes
      .map((triggerType) => getTriggerStr(colIter, triggerType, triggers))
      .join("");
    const triggerWithImportStr =
      getModelImportsStr(schema) + utilImports + "\n" + triggerStr;

    fs.writeFileSync(
      path.join(triggerDir, `${colName}.ts`),
      triggerWithImportStr
    );
  });
}
