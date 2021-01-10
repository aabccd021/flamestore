import path from "path";
import * as fs from "fs";
import { CollectionEntry } from "../generator-types";
import { t } from "../generator-utils";
import { importsStr } from "./flutter-template";
import { toColStr } from "./flutter-collection-template";
import { ProjectConfiguration } from "../schema-processor/schema-types";
import { getConfigStr } from "./flutter-config-template";
import { mapPick } from "../../lodash-utils";
import { getDynamicBuilderStr } from "./flutter-dynamic-link-builders-template";

export function generateFlutter(
  outputFilePath: string,
  colEntries: CollectionEntry[],
  project: { [name: string]: ProjectConfiguration }
): void {
  const colContent = colEntries.map(toColStr).join("\n");
  const colNames = mapPick(colEntries, "colName").value();
  const configStr = getConfigStr(colNames, project);
  const dlBuilderStr = getDynamicBuilderStr(colEntries);
  const content = importsStr + colContent + configStr + dlBuilderStr;
  fs.writeFileSync(path.join(outputFilePath, t`flamestore.g.dart`), content);
}
