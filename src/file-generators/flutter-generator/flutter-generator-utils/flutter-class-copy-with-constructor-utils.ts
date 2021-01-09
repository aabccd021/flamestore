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

export function toCwConstrArgStr(fcEntry: FieldCollectionEntry): string[] {
  const { field, fName } = fcEntry;
  console.log(fName);
  console.log(field.isKeyField);
  console.log();
  if (field.isKeyField) return [];
  if (isCountField(field)) return [];
  if (isDynamicLinkField(field)) return [];
  if (isServerTimestampField(field)) return [];
  if (isSumField(field)) return [];
  if (isComputedField(field)) return [];
  if (isPathField(field)) return [];
  const fileTypeStr = toPrimCwConstrArgStr(field);
  return [t`${fileTypeStr} ${fName}`];
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
