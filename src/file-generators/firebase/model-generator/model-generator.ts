import { FlameSchema } from "../../../type";
import * as path from "path";
import * as fs from "fs";
import {
  getNonComputedInterfaceStr,
  getNonComputedFieldStr,
  modelImportsStr,
  toComputedModelStr,
} from "./model-generator-templates";
import { colsOf, fieldsOfCol } from "../../utils";
import { getIsFieldRequired, valueOfFieldStr } from "./model-generator-utils";

export function generateFirebaseModel(
  outputFilePath: string,
  schema: FlameSchema
): void {
  const cols = colsOf(schema);
  const computedModelStr = cols.map(toComputedModelStr).join("");
  const nonComputedModelStr = cols
    .map(({colName, col}) => {
      const modelContentStr = fieldsOfCol({colName, col})
        .map(({ field, fName }) => {
          const isFieldRequired = getIsFieldRequired(field);
          const fieldValueStr = valueOfFieldStr({ field, schema });
          return getNonComputedFieldStr({
            isFieldRequired,
            fieldValueStr,
            fName
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
