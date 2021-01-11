import {
  FieldCollectionEntry,
  isPathField,
  isStringField,
} from "../../generator-types";
import { suf, t } from "../../generator-utils";

export function getKeyGetterStr(
  fs: _.Collection<FieldCollectionEntry>
): string {
  const keyStrs = fs.map(toKeysStr).compact().map(suf(","));
  //
  if (keyStrs.isEmpty()) return "";
  //
  return t`@override List<String> get keys {return [${keyStrs}];}`;
}

function toKeysStr(fcEntry: FieldCollectionEntry): string | null {
  const { field, fName } = fcEntry;
  if (isStringField(field)) {
    if (!field.isKeyField) return null;
    return fName;
  }
  if (isPathField(field)) {
    if (!field.isKeyField) return null;
    return t`${fName}.reference?.id`;
  }
  return null;
}
