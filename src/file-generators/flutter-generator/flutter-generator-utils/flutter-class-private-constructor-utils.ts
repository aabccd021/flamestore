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

export function toAnonPrivConstrArgStr(
  fcEntry: FieldCollectionEntry
): string[] {
  const { field, fName } = fcEntry;
  if (isCountField(field)) return [];
  if (isDynamicLinkField(field)) return [];
  if (isFloatField(field)) return [];
  if (isIntField(field)) return [];
  if (isServerTimestampField(field)) return [];
  if (isStringField(field)) return [];
  if (isSumField(field)) return [];
  if (isComputedField(field)) return [];
  if (isPathField(field)) return [];
  if (isImageField(field)) return [`this._${fName}`];
  assertNever(field);
}
export function toNamedPrivConstrArgStr(
  fcEntry: FieldCollectionEntry
): string[] {
  const { fName } = fcEntry;
  return [`@required this.${fName}`];
  // if (isImageField(field)) {
  //   const pascalColName = toPascalColName(colName);
  //   const pascalFieldName = _.upperFirst(fName);
  //   return [
  //     t`${fName} = _${pascalColName}${pascalFieldName}._fromMap(data['${fName}'])`,
  //     t`_${fName} = null`,
  //   ];
  // }
  // if (isPathField(field)) {
  //   const pascalColName = toPascalColName(colName);
  //   const pascalFieldName = _.upperFirst(fName);
  //   return [
  //     t`${fName} = _${pascalColName}${pascalFieldName}._fromMap(data['${fName}'])`,
  //   ];
  // }
  // const fieldClassName = normalFieldToFromMapConstrAssgStr(field);
  // return [t`${fName} = ${fieldClassName}Field.fromMap(data['${fName}']).value`];
}

// function normalFieldToFromMapConstrAssgStr(
//   field: Exclude<Field, PathField | ImageField>
// ): "Count" | "DynamicLink" | "Float" | "Int" | "Timestamp" | "String" | "Sum" {
//   if (isCountField(field)) return "Count";
//   if (isDynamicLinkField(field)) return "DynamicLink";
//   if (isFloatField(field)) return "Float";
//   if (isIntField(field)) return "Int";
//   if (isServerTimestampField(field)) return "Timestamp";
//   if (isStringField(field)) return "String";
//   if (isSumField(field)) return "Sum";
//   if (isComputedField(field)) {
//     if (field.computedFieldType === "float") return "Float";
//     if (field.computedFieldType === "int") return "Int";
//     if (field.computedFieldType === "string") return "String";
//     if (field.computedFieldType === "timestamp") return "Timestamp";
//     assertNever(field.computedFieldType);
//   }
//   assertNever(field);
// }
