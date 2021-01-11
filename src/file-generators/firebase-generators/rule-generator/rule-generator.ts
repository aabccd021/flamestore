import { CollectionEntry } from "../../generator-types";
import * as fs from "fs";
import { getRuleStr } from "./rule-generator-template";

export function generateFirebaseRule(
  rulePath: string,
  colEntries: CollectionEntry[]
): void {
  const ruleStr = getRuleStr(colEntries);
  fs.writeFileSync(rulePath, ruleStr);
}
