import _ from "lodash";
import { CollectionEntry, FieldEntry } from "../generator-types";
import { suf, t, toPascalColName } from "../generator-utils";
import {
  toConstrArgStr,
  toConstrAssgStr,
} from "./flutter-generator-utils/flutter-class-default-constructor-utils";
import { toFieldStr } from "./flutter-generator-utils/flutter-class-fields-utils";
import { toFromMapConstrAssgStr } from "./flutter-generator-utils/flutter-class-from-map-constructor-utils";

export function colEntryToStr(colEntry: CollectionEntry): string {
  const { colName, col } = colEntry;
  const fields = _(col.fields);
  const pascal: string = toPascalColName(colName);
  const constructorArgStr = compactComma(fields, toConstrArgStr);
  const constructorAssgStr = compactComma(fields, toConstrAssgStr);
  const fieldStr = fields.map(toFieldStr).flatMap().map(suf(";")).join("");
  const fromMapConstrAssgStr = fields.map(toFromMapConstrAssgStr).compact();
  return t`class ${pascal} extends Document{
    ${pascal}({${constructorArgStr}}): ${constructorAssgStr} super(null);
    ${pascal}._fromMap(Map<String, dynamic> data)
      : ${fromMapConstrAssgStr} super(data['reference']);
    ${fieldStr}
  }`;
}

function compactComma(
  fields: _.Collection<FieldEntry>,
  fn: (fEntry: FieldEntry) => string | null
): string {
  return fields.map(fn).compact().map(suf(",")).join("");
}

export const importsStr = t`
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flamestore/flamestore.dart';
import 'package:flutter/widgets.dart';
`;
