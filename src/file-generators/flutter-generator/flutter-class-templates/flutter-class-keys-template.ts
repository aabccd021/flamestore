import {
  FieldCollectionEntry,
  isPathField,
  isStringField,
} from "../../generator-types";
import { suf, t } from "../../generator-utils";

export function toKeysStr(fcEntry: FieldCollectionEntry): string | null {
  const { field, fName } = fcEntry;
  if (!field.isKeyField) return null;
  if (isStringField(field)) return fName;
  if (isPathField(field)) return t`${fName}.reference?.id`;
  throw Error();
}

export function getKeyGetterStr(
  fs: _.Collection<FieldCollectionEntry>
): string {
  const keyStrs = fs.map(toKeysStr).compact().map(suf(","));
  if (keyStrs.isEmpty()) return "";
  const keyStr = keyStrs.join("");
  return t`@override
    List<String> get keys {
      return [${keyStr}];
    }`;
}
