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
): string[] {
  const { field, fName } = fcEntry;
  if (isCountField(field)) return [];
  if (isDynamicLinkField(field)) return [];
  if (isFloatField(field)) return [];
  if (isIntField(field)) return [];
  if (isServerTimestampField(field)) return [];
  if (isStringField(field)) return [];
  if (isSumField(field)) return [];
  if (isComputedField(field)) return [];
  if (isPathField(field)) return [];
  if (isImageField(field)) return [`this._${fName}`];
  assertNever(field);
}
export function toNamedPrivConstrArgStr(
  fcEntry: FieldCollectionEntry
): string[] {
  const { fName } = fcEntry;
  return [`@required this.${fName}`];
}
