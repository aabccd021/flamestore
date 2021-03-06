import path from "path";
import * as fs from "fs";
import { CollectionEntry } from "../generator-types";
import { mapPick, t } from "../generator-utils";
import { importsStr } from "./flutter-template";
import { toColStr } from "./flutter-collection-template";
import { ProjectConfiguration } from "../schema-processor/schema-types";
import { getConfigStr } from "./flutter-config-template";
import { getDynamicBuilderStr } from "./flutter-dynamic-link-builders-template";

export function generateFlutter(
  outputFilePath: string,
  colEntries: CollectionEntry[],
  project: { [name: string]: ProjectConfiguration }
): void {
  const colContent = colEntries.map(toColStr).join("");
  const colNames = mapPick(colEntries, "colName").value();
  const configStr = getConfigStr(colNames, project);
  const dlBuilderStr = getDynamicBuilderStr(colEntries);
  const content = `${importsStr}${colContent}\n\n${configStr}\n\n${dlBuilderStr}`;
  fs.writeFileSync(path.join(outputFilePath, t`flamestore.g.dart`), content);
}
