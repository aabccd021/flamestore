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

export function isFieldFirestoreCreatable(
  fcEntry: FieldCollectionEntry
): boolean {
  const { field } = fcEntry;
  if (isFloatField(field)) return true;
  if (isIntField(field)) return true;
  if (isStringField(field)) return true;
  if (isDynamicLinkField(field)) return true;
  if (isPathField(field)) return true;
  if (isCountField(field)) return false;
  if (isSumField(field)) return false;
  if (isComputedField(field)) return false;
  if (isServerTimestampField(field)) return false;
  if (isImageField(field)) return false;
  assertNever(field);
}

export function isFieldFirestoreUpdatable(
  fcEntry: FieldCollectionEntry
): boolean {
  const { field } = fcEntry;
  if (field.isKeyField) return false;
  if (field.isNotUpdatable) return false;
  if (isDynamicLinkField(field)) return false;
  if (isPathField(field)) return false;
  if (isCountField(field)) return false;
  if (isSumField(field)) return false;
  if (isComputedField(field)) return false;
  if (isServerTimestampField(field)) return false;
  if (isImageField(field)) return false;
  if (isFloatField(field)) return true;
  if (isIntField(field)) return true;
  if (isStringField(field)) return true;
  assertNever(field);
}
