import {
  FieldCollectionEntry,
  isPathField,
  isStringField,
} from "../../generator-types";
import { t } from "../../generator-utils";
import { compactSuf } from "../flutter-generator-utils";

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
  const keyStrs = compactSuf(fs, toKeysStr, ",");
  if (keyStrs.length === 0) return "";
  return `@override
    List<String> get keys {
      return [${keyStrs}];
    }`;
}
