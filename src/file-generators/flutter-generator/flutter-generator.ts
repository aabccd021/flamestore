import path from "path";
import * as fs from "fs";
import { CollectionEntry } from "../generator-types";
import { colEntryToStr } from "./flutter-generator-col-utils";
import { importsStr } from "./flutter-generator-template";

export function generateFlutter(
  outputFilePath: string,
  colEntries: CollectionEntry[]
): void {
  const colContent = colEntries.map(colEntryToStr).join("\n");
  const content = importsStr + colContent;
  fs.writeFileSync(path.join(outputFilePath, `flamestore.g.dart`), content);
}
