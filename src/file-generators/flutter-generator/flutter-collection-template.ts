import { CollectionEntry, isImageField, isPathField } from "../generator-types";
import { toClassStr } from "./flutter-class-template";
import { getDefStr } from "./flutter-definition-template";
import { getImageClassStr } from "./flutter-field-class-templates/flutter-image-class-template";
import { getPathClassStr } from "./flutter-field-class-templates/flutter-path-class-template";

export function toColStr(colEntry: CollectionEntry): string {
  const { colName, col } = colEntry;
  const classStr = toClassStr(colEntry);
  const fieldClassStr = col.fields
    .map(({ field, fName }) => {
      const fData = { fName, colName };
      if (isImageField(field)) return getImageClassStr(field, fData);
      if (isPathField(field)) return getPathClassStr(field, fData);
      return "";
    })
    .join("");
  const defStr = getDefStr(colEntry);
  return fieldClassStr + classStr + defStr;
}
