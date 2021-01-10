import path from "path";
import * as fs from "fs";
import { CollectionEntry } from "../generator-types";
import { t } from "../generator-utils";
import { importsStr } from "./flutter-template";
import { toColStr } from "./flutter-collection-template";

export function generateFlutter(
  outputFilePath: string,
  colEntries: CollectionEntry[]
): void {
  const colContent = colEntries.map(toColStr).join("\n");
  const content = importsStr + colContent;
  fs.writeFileSync(path.join(outputFilePath, t`flamestore.g.dart`), content);
}
