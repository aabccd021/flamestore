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
  ComputedField,
} from "../../generator-types";
import { t, toPascalColName } from "../../generator-utils";
import { isConstrArgRequired } from "../flutter-generator-utils";

export function toConstrAssgStr(fEntry: FieldEntry): string | null {
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

export function toConstrArgStr(fEntry: FieldEntry): string | null {
  const { fName, field } = fEntry;
  if (isComputedField(field)) return null;
  if (isCountField(field)) return null;
  if (isServerTimestampField(field)) return null;
  if (isSumField(field)) return null;
  if (isDynamicLinkField(field)) return null;
  const requiredStr = isConstrArgRequired(field) ? "@required " : "";
  return requiredStr + getCreatableConstrArgStr(fName, field);
}

function getCreatableConstrArgStr(
  fName: string,
  field: Exclude<
    Field,
    | CountField
    | ServerTimestampField
    | SumField
    | DynamicLinkField
    | ComputedField
  >
): string {
  if (isImageField(field)) return t`File ${fName}`;
  if (isComputedField(field)) return t`this.${fName}`;
  if (isCountField(field)) return t`this.${fName}`;
  if (isDynamicLinkField(field)) return t`this.${fName}`;
  if (isFloatField(field)) return t`this.${fName}`;
  if (isImageField(field)) return t`this.${fName}`;
  if (isIntField(field)) return t`this.${fName}`;
  if (isServerTimestampField(field)) return t`this.${fName}`;
  if (isStringField(field)) return t`this.${fName}`;
  if (isSumField(field)) return t`this.${fName}`;
  if (isPathField(field)) {
    const pascalColName = toPascalColName(field.colName);
    return t`${pascalColName} ${fName}`;
  }
  assertNever(field);
}
