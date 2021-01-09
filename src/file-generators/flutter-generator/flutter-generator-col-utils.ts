import _ from "lodash";
import { CollectionEntry } from "../generator-types";
import { getDocClassStr } from "./flutter-generator-template";
import {
  getConstrArgStr,
  getConstrAssgStr,
} from "./flutter-generator-utils/flutter-class-default-constructor-utils";
import { toFieldStr } from "./flutter-generator-utils/flutter-class-fields-utils";

export function colEntryToStr(colEntry: CollectionEntry): string {
  const { colName, col } = colEntry;
  const fields = _(col.fields);
  const constructorArgStrs = fields.map(getConstrArgStr).compact().value();
  const constructorAssgStrs = fields.map(getConstrAssgStr).compact().value();
  const fieldStrs = fields.map(toFieldStr).flatMap().value();
  const colParams = {
    colName,
    constructorArgStrs,
    constructorAssgStrs,
    fieldStrs,
  };
  return getDocClassStr(colParams);
}
