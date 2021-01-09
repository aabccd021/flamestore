import { assertNever } from "../../../utils";
import {
  FieldEntry,
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
  Field,
  CountField,
  ServerTimestampField,
  SumField,
  DynamicLinkField,
} from "../../generator-types";
import { t } from "../../generator-utils";
import { isConstrArgRequired } from "../flutter-generator-utils";

export function getConstrAssgStr(fEntry: FieldEntry): string | null {
  const { fName, field } = fEntry;
  if (isComputedField(field)) return null;
  if (isCountField(field)) return t`${fName} = 0`;
  if (isDynamicLinkField(field)) return null;
  if (isFloatField(field)) return null;
  if (isImageField(field)) return null;
  if (isIntField(field)) return null;
  if (isPathField(field)) return null;
  if (isServerTimestampField(field)) return null;
  if (isStringField(field)) return null;
  if (isSumField(field)) return null;
  assertNever(field);
}

export function getConstrArgStr(fEntry: FieldEntry): string | null {
  const { fName, field } = fEntry;
  if (isCountField(field)) return null;
  if (isServerTimestampField(field)) return null;
  if (isSumField(field)) return null;
  if (isDynamicLinkField(field)) return null;
  return getCreatableConstrArgStr(fName, field);
}

function getCreatableConstrArgStr(
  fName: string,
  field: Exclude<
    Field,
    CountField | ServerTimestampField | SumField | DynamicLinkField
  >
): string {
  const requiredStr: string = isConstrArgRequired(field) ? "@required " : "";
  return t`${requiredStr}this.${fName}`;
}
