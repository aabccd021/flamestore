import path from "path";
import * as fs from "fs";
import { CollectionEntry } from "../generator-types";
import { colEntryToStr, importsStr } from "./flutter-generator-template";
import { t } from "../generator-utils";

export function generateFlutter(
  outputFilePath: string,
  colEntries: CollectionEntry[]
): void {
  const colContent = colEntries.map(colEntryToStr).join("\n");
  const content = importsStr + colContent;
  fs.writeFileSync(path.join(outputFilePath, t`flamestore.g.dart`), content);
}
