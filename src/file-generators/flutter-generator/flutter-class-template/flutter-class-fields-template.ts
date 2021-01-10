import _ from "lodash";
import { assertNever } from "../../../utils";
import {
  isComputedField,
  isImageField,
  Field,
  ImageField,
  isCountField,
  isDynamicLinkField,
  isFloatField,
  isIntField,
  isPathField,
  isServerTimestampField,
  isStringField,
  isSumField,
  FieldCollectionEntry,
  PathField,
} from "../../generator-types";
import { t, toPascalColName } from "../../generator-utils";

export function toFieldStr(fcEntry: FieldCollectionEntry): string[] {
  const { field, fName, colName } = fcEntry;
  if (isImageField(field)) {
    const pascalColName = toPascalColName(colName);
    const pascalImageFieldName = _.upperFirst(fName);
    return [
      t`final File _${fName}`,
      t`final _${pascalColName}${pascalImageFieldName} ${fName}`,
    ];
  }
  if (isPathField(field)) {
    const pascalColName = toPascalColName(colName);
    const pascalFieldName = _.upperFirst(fName);
    return [t`final _${pascalColName}${pascalFieldName} ${fName}`];
  }
  const fieldTypeStr: string = getNormalFieldStr(field);
  return [t`final ${fieldTypeStr} ${fName}`];
}

function getNormalFieldStr(
  field: Exclude<Field, ImageField | PathField>
): "int" | "String" | "double" | "DateTime" | "DocumentReference" {
  if (isCountField(field)) return "int";
  if (isDynamicLinkField(field)) return "String";
  if (isFloatField(field)) return "double";
  if (isIntField(field)) return "int";
  if (isServerTimestampField(field)) return "DateTime";
  if (isStringField(field)) return "String";
  if (isSumField(field)) return "double";
  if (isComputedField(field)) {
    if (field.computedFieldType === "float") return "double";
    if (field.computedFieldType === "int") return "int";
    if (field.computedFieldType === "string") return "String";
    if (field.computedFieldType === "timestamp") return "DateTime";
    assertNever(field.computedFieldType);
  }
  assertNever(field);
}
