import { assertNever } from "../../utils";
import {
  ComputedField,
  CountField,
  DynamicLinkField,
  Field,
  FieldEntry,
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
  ServerTimestampField,
  SumField,
} from "../generator-types";
import { t, toPascalColName } from "../generator-utils";
import { isConstrArgRequired } from "./flutter-generator-utils";

export function getDocClassStr({
  colName,
  constructorArgStrs,
  constructorAssgStrs,
  fieldStrs,
}: {
  colName: string;
  constructorArgStrs: string[];
  constructorAssgStrs: string[];
  fieldStrs: string[];
}): string {
  const pascal: string = toPascalColName(colName);
  const fieldStr: string = fieldStrs.map((x) => t`${x};`).join("");
  const constructorArgStr = constructorArgStrs.map((x) => t`${x},`).join("");
  const constructorAssgStr = constructorAssgStrs.map((x) => t`${x},`).join("");
  return t`class ${pascal} extends Document{
    ${pascal}({${constructorArgStr}}): ${constructorAssgStr} super(null);
    ${fieldStr}
  }`;
}

export const importsStr = t`
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flamestore/flamestore.dart';
import 'package:flutter/widgets.dart';
`;

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

export function getFieldStrs(fEntry: FieldEntry): string[] {
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
