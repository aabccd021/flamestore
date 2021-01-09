import _ from "lodash";
import { CollectionEntry } from "../generator-types";
import {
  getConstrArgStr,
  getConstrAssgStr,
  getDocClassStr,
  getFieldStrs as toFieldStrs,
} from "./flutter-generator-template";

export function colEntryToStr(colEntry: CollectionEntry): string {
  const { colName, col } = colEntry;
  const fields = _(col.fields);
  const constructorArgStrs = fields.map(getConstrArgStr).compact().value();
  const constructorAssgStrs = fields.map(getConstrAssgStr).compact().value();
  const fieldStrs = fields.map(toFieldStrs).flatMap().value();
  const colParams = {
    colName,
    constructorArgStrs,
    constructorAssgStrs,
    fieldStrs,
  };
  return getDocClassStr(colParams);
}
