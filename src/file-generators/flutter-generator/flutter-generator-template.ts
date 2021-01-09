import { suf, t, toPascalColName } from "../generator-utils";

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
  const fieldStr: string = fieldStrs.map(suf(",")).join("");
  const constructorArgStr = constructorArgStrs.map(suf(",")).join("");
  const constructorAssgStr = constructorAssgStrs.map(suf(";")).join("");
  return t`class ${pascal} extends Document{
    ${pascal}({${constructorArgStr}}): ${constructorAssgStr} super(null);
    ${pascal}._fromMap(Map<string, dynamic> data): super(data['reference']);
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
