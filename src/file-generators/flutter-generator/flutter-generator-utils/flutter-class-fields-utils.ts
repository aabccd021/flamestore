import { assertNever } from "../../../utils";
import {
  FieldEntry,
  isComputedField,
  isImageField,
  Field,
  ComputedField,
  ImageField,
  isCountField,
  isDynamicLinkField,
  isFloatField,
  isIntField,
  isPathField,
  isServerTimestampField,
  isStringField,
  isSumField,
} from "../../generator-types";

export function toFieldStr(fEntry: FieldEntry): string[] {
  const { field, fName } = fEntry;
  if (isComputedField(field)) return [];
  if (isImageField(field)) {
    return [`final File _${fName}`];
  }
  const fieldTypeStr: string = getNormalFieldStr(field);
  return [`final ${fieldTypeStr} ${fName}`];
}

function getNormalFieldStr(
  field: Exclude<Field, ComputedField | ImageField>
): string {
  if (isCountField(field)) return "int";
  if (isDynamicLinkField(field)) return "String";
  if (isFloatField(field)) return "double";
  if (isIntField(field)) return "int";
  if (isPathField(field)) return "DocumentReference";
  if (isServerTimestampField(field)) return "DateTime";
  if (isStringField(field)) return "String";
  if (isSumField(field)) return "double";
  assertNever(field);
}
