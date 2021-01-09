import _ from "lodash";
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
  FieldCollectionEntry,
} from "../../generator-types";
import { t, toPascalColName } from "../../generator-utils";
import { isConstrArgRequired } from "../flutter-generator-utils";

export function toConstrAssgStr(fcEntry: FieldCollectionEntry): string[] {
  const { fName, field, colName } = fcEntry;
  if (isComputedField(field)) return [t`${fName} = null`];
  if (isCountField(field)) return [t`${fName} = 0`];
  if (isDynamicLinkField(field)) return [t`${fName} = null`];
  if (isFloatField(field)) return [];
  if (isIntField(field)) return [];
  if (isServerTimestampField(field)) return [t`${fName} = null`];
  if (isStringField(field)) return [];
  if (isSumField(field)) return [t`${fName} = 0`];
  if (isImageField(field)) return [t`_${fName} = ${fName}`, t`${fName} = null`];
  if (isPathField(field)) {
    const pascalColName = toPascalColName(colName);
    const pascalFieldName = _.upperFirst(fName);
    const pascalSyncColName = toPascalColName(field.colName);
    return [
      t`${fName} = _${pascalColName}${pascalFieldName}._from${pascalSyncColName}(${fName})`,
    ];
  }
  assertNever(field);
}

export function toConstrArgStr(fEntry: FieldEntry): string[] {
  const { fName, field } = fEntry;
  if (isComputedField(field)) return [];
  if (isCountField(field)) return [];
  if (isServerTimestampField(field)) return [];
  if (isSumField(field)) return [];
  if (isDynamicLinkField(field)) return [];
  const requiredStr = isConstrArgRequired(field) ? "@required " : "";
  return [requiredStr + getCreatableConstrArgStr(fName, field)];
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
