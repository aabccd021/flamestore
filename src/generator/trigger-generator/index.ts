import * as path from "path";
import * as fs from "fs";
import _ from "lodash";
import { FlamestoreSchema } from "../../type";
import { colItersOf, fItersOf } from "../util";
import { getTriggerMap } from "./field-trigger-generator";
import { Trigger } from "./type";
import { getColTriggerString } from "./generate-col-trigger";

export default function generateTrigger(
  outputFilePath: string,
  schema: FlamestoreSchema
): void {
  const triggers: Trigger[] = _.flatMap(
    colItersOf(schema).map((colIter) =>
      _.flatMap(fItersOf(colIter).map(getTriggerMap))
    )
  );
  const triggerDir = path.join(outputFilePath, "flamestore");
  colItersOf(schema).forEach((colIter) => {
    const { colName } = colIter;
    const colTriggers = triggers.filter(
      (trigger) => trigger.colName === colName
    );
    const triggerContent = getColTriggerString(colIter, colTriggers);

    if (!fs.existsSync(triggerDir)) fs.mkdirSync(triggerDir);
    fs.writeFileSync(path.join(triggerDir, `${colName}.ts`), triggerContent);
  });
}
