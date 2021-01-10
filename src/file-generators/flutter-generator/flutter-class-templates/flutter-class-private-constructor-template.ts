import { assertNever } from "../../../utils";
import {
  FieldCollectionEntry,
  isComputedField,
  isCountField,
  isDynamicLinkField,
  isFloatField,
  isImageField,
  isIntField,
  isPathField,
  isServerTimestampField,
  isStringField,
  isSumField,
} from "../../generator-types";

export function toAnonPrivConstrArgStr(
  fcEntry: FieldCollectionEntry
): string | null {
  const { field, fName } = fcEntry;
  if (isCountField(field)) return null;
  if (isDynamicLinkField(field)) return null;
  if (isFloatField(field)) return null;
  if (isIntField(field)) return null;
  if (isServerTimestampField(field)) return null;
  if (isStringField(field)) return null;
  if (isSumField(field)) return null;
  if (isComputedField(field)) return null;
  if (isPathField(field)) return null;
  if (isImageField(field)) return `this._${fName}`;
  assertNever(field);
}
export function toNamedPrivConstrArgStr(fcEntry: FieldCollectionEntry): string {
  const { fName } = fcEntry;
  return `@required this.${fName}`;
}
