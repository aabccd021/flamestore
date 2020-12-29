import { FlamestoreSchema } from "../../../type";
import * as path from "path";
import * as fs from "fs";
import {
  getNonComputedInterfaceStr,
  getNonComputedFieldStr,
  schemaImportsStr,
  toComputedModelStr,
} from "./model-generator-templates";
import { colsOf, fItersOf } from "../../utils";
import { getIsFieldRequired, valueOfFieldStr } from "./model-generator-utis";

export function generateFirebaseModel(
  outputFilePath: string,
  schema: FlamestoreSchema
): void {
  const cols = colsOf(schema);
  const computedModelStr = cols.map(toComputedModelStr).join("");
  const nonComputedModelStr = cols
    .map((colIter) => {
      const { colName } = colIter;
      const interfaceContent = fItersOf(colIter)
        .map((fIter) => {
          const { field } = fIter;
          const isFieldRequired = getIsFieldRequired(field);
          const fieldValueStr = valueOfFieldStr({ field, schema });
          return getNonComputedFieldStr({
            isFieldRequired,
            fieldValueStr,
            ...fIter,
          });
        })
        .join("");
      return getNonComputedInterfaceStr({ colName, interfaceContent });
    })
    .join("\n\n");
  const modelFileStr = [
    schemaImportsStr,
    nonComputedModelStr,
    computedModelStr,
  ].join("\n\n");
  const fileName = path.join(outputFilePath, "models.ts");
  fs.writeFileSync(fileName, modelFileStr);
}
