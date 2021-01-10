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

export function toConstrAssgStr(fcEntry: FieldCollectionEntry): string[] {
  const { fName, field, colName } = fcEntry;
  const assignNullStr = t`${fName} = null`;
  if (isFloatField(field)) return [];
  if (isIntField(field)) return [];
  if (isStringField(field)) return [];
  if (isCountField(field)) return [t`${fName} = 0`];
  if (isSumField(field)) return [t`${fName} = 0`];
  if (isComputedField(field)) return [assignNullStr];
  if (isDynamicLinkField(field)) return [assignNullStr];
  if (isServerTimestampField(field)) return [assignNullStr];
  if (isImageField(field)) return [t`_${fName} = ${fName}`, assignNullStr];
  if (isPathField(field)) {
    const pascalColName = toPascalColName(colName);
    const pascalFieldName = _.upperFirst(fName);
    const pascalSyncColName = toPascalColName(field.colName);
    const assignPathStr = t`${fName} = _${pascalColName}${pascalFieldName}._from${pascalSyncColName}(${fName})`;
    return [assignPathStr];
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
  const requiredStr = field.isOptional ? "" : "@required ";
  return [requiredStr + getCreatableConstrArgStr(fName, field)];
}

type UncreatableFields =
  | CountField
  | ServerTimestampField
  | SumField
  | DynamicLinkField
  | ComputedField;

function getCreatableConstrArgStr(
  fName: string,
  field: Exclude<Field, UncreatableFields>
): string {
  const thisStr = t`this.${fName}`;
  if (isImageField(field)) return t`File ${fName}`;
  if (isComputedField(field)) return thisStr;
  if (isCountField(field)) return thisStr;
  if (isDynamicLinkField(field)) return thisStr;
  if (isFloatField(field)) return thisStr;
  if (isImageField(field)) return thisStr;
  if (isIntField(field)) return thisStr;
  if (isServerTimestampField(field)) return thisStr;
  if (isStringField(field)) return thisStr;
  if (isSumField(field)) return thisStr;
  if (isPathField(field)) {
    const pascalColName = toPascalColName(field.colName);
    return t`${pascalColName} ${fName}`;
  }
  assertNever(field);
}
