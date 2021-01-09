import _ from "lodash";
import { assertNever } from "../../../utils";
import {
  Field,
  FieldCollectionEntry,
  ImageField,
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
  PathField,
} from "../../generator-types";
import { t, toPascalColName } from "../../generator-utils";

export function toFromMapConstrAssgStr(
  fcEntry: FieldCollectionEntry
): string[] {
  const { field, fName, colName } = fcEntry;
  if (isImageField(field)) {
    const pascalColName = toPascalColName(colName);
    const pascalFieldName = _.upperFirst(fName);
    return [
      t`${fName} = _${pascalColName}${pascalFieldName}._fromMap(data['${fName}'])`,
      t`_${fName} = null`,
    ];
  }
  if (isPathField(field)) {
    const pascalColName = toPascalColName(colName);
    const pascalFieldName = _.upperFirst(fName);
    return [
      t`${fName} = _${pascalColName}${pascalFieldName}._fromMap(data['${fName}'])`,
    ];
  }
  const fieldClassName = normalFieldToFromMapConstrAssgStr(field);
  return [t`${fName} = ${fieldClassName}Field.fromMap(data['${fName}']).value`];
}

function normalFieldToFromMapConstrAssgStr(
  field: Exclude<Field, PathField | ImageField>
): "Count" | "DynamicLink" | "Float" | "Int" | "Timestamp" | "String" | "Sum" {
  if (isCountField(field)) return "Count";
  if (isDynamicLinkField(field)) return "DynamicLink";
  if (isFloatField(field)) return "Float";
  if (isIntField(field)) return "Int";
  if (isServerTimestampField(field)) return "Timestamp";
  if (isStringField(field)) return "String";
  if (isSumField(field)) return "Sum";
  if (isComputedField(field)) {
    if (field.computedFieldType === "float") return "Float";
    if (field.computedFieldType === "int") return "Int";
    if (field.computedFieldType === "string") return "String";
    if (field.computedFieldType === "timestamp") return "Timestamp";
    assertNever(field.computedFieldType);
  }
  assertNever(field);
}
