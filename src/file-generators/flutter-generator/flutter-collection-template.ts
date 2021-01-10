import {
  CollectionEntry,
  FieldCollectionEntry,
  isImageField,
  isPathField,
} from "../generator-types";
import { fieldColEntriesOfCol, t } from "../generator-utils";
import { toClassStr } from "./flutter-class-template";
import { getDefStr } from "./flutter-definition-template";
import { getImageClassStr } from "./flutter-field-class-templates/flutter-image-class-template";
import { getPathClassStr } from "./flutter-field-class-templates/flutter-path-class-template";

export function toColStr(colEntry: CollectionEntry): string {
  const classStr = toClassStr(colEntry);
  const fcEntries = fieldColEntriesOfCol(colEntry);
  const fieldClassStr = fcEntries.map(fcEntryToStr);
  const defStr = getDefStr(colEntry);
  return t`${fieldClassStr}${classStr}${defStr}`;
}

function fcEntryToStr(fcEntry: FieldCollectionEntry): string {
  const { field } = fcEntry;
  if (isImageField(field)) return getImageClassStr(field, fcEntry);
  if (isPathField(field)) return getPathClassStr(field, fcEntry);
  return "";
}
