import { assertNever } from "../../../utils";
import {
  FieldCollectionEntry,
  FloatField,
  ImageField,
  IntField,
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
  StringField,
} from "../../generator-types";
import { t } from "../../generator-utils";

export function toCwConstrArgStr(fcEntry: FieldCollectionEntry): string | null {
  const { field, fName } = fcEntry;
  if (field.isKeyField) return null;
  if (isCountField(field)) return null;
  if (isDynamicLinkField(field)) return null;
  if (isServerTimestampField(field)) return null;
  if (isSumField(field)) return null;
  if (isComputedField(field)) return null;
  if (isPathField(field)) return null;
  const fileTypeStr = toPrimCwConstrArgStr(field);
  return t`${fileTypeStr} ${fName}`;
}

function toPrimCwConstrArgStr(
  field: IntField | FloatField | ImageField | StringField
): "File" | "String" | "int" | "double" {
  if (isIntField(field)) return "int";
  if (isFloatField(field)) return "double";
  if (isImageField(field)) return "File";
  if (isStringField(field)) return "String";
  assertNever(field);
}

export function toCwNamedConstrAssgStr(
  fcEntry: FieldCollectionEntry
): string | null {
  const { field, fName } = fcEntry;
  const useExistingStr = t`${fName}: this.${fName}`;
  const assignIfAbsentStr = t`${fName}: ${fName}?? this.${fName}`;
  if (field.isKeyField) return useExistingStr;
  if (isCountField(field)) return useExistingStr;
  if (isDynamicLinkField(field)) return useExistingStr;
  if (isServerTimestampField(field)) return useExistingStr;
  if (isSumField(field)) return useExistingStr;
  if (isComputedField(field)) return useExistingStr;
  if (isImageField(field)) return useExistingStr;
  if (isPathField(field)) return useExistingStr;
  if (isIntField(field)) return assignIfAbsentStr;
  if (isFloatField(field)) return assignIfAbsentStr;
  if (isStringField(field)) return assignIfAbsentStr;
  assertNever(field);
}

export function toCwAnonConstrAssgStr(
  fcEntry: FieldCollectionEntry
): string | null {
  const { field, fName } = fcEntry;
  if (isCountField(field)) return null;
  if (isDynamicLinkField(field)) return null;
  if (isServerTimestampField(field)) return null;
  if (isSumField(field)) return null;
  if (isComputedField(field)) return null;
  if (isPathField(field)) return null;
  if (isIntField(field)) return null;
  if (isFloatField(field)) return null;
  if (isStringField(field)) return null;
  if (isImageField(field)) return t`${fName} ?? this._${fName}`;
  assertNever(field);
}
