import _ from "lodash";
import { CollectionEntry, FieldCollectionEntry } from "../generator-types";
import {
  fieldColEntriesOfCol,
  suf,
  t,
  toPascalColName,
} from "../generator-utils";
import { toCwConstrArgStr } from "./flutter-generator-utils/flutter-class-copy-with-constructor-utils";
import {
  toConstrArgStr,
  toConstrAssgStr,
} from "./flutter-generator-utils/flutter-class-default-constructor-utils";
import { toFieldStr } from "./flutter-generator-utils/flutter-class-fields-utils";
import { toFromMapConstrAssgStr } from "./flutter-generator-utils/flutter-class-from-map-constructor-utils";
import {
  toAnonPrivConstrArgStr,
  toNamedPrivConstrArgStr,
} from "./flutter-generator-utils/flutter-class-private-constructor-utils";

export function colEntryToStr(colEntry: CollectionEntry): string {
  //
  const { colName } = colEntry;
  const fields = _(fieldColEntriesOfCol(colEntry));
  //
  const pascal = toPascalColName(colName);
  //
  const constructorArgStr = flatSuf(fields, toConstrArgStr, ",");
  const constructorAssgStr = flatSuf(fields, toConstrAssgStr, ",");
  const fieldStr = flatSuf(fields, toFieldStr, ";");
  const fromMapConstrAssgStr = flatSuf(fields, toFromMapConstrAssgStr, ",");
  const anonPrivConstrArgStr = flatSuf(fields, toAnonPrivConstrArgStr, ",");
  const namedPrivConstrArgStr = flatSuf(fields, toNamedPrivConstrArgStr, ",");
  const cwConstrArgStr = flatSuf(fields, toCwConstrArgStr, ",");
  //
  return t`class ${pascal} extends Document{
    ${pascal}({${constructorArgStr}}): ${constructorAssgStr} super(null);
    ${pascal}._fromMap(Map<String, dynamic> data)
      : ${fromMapConstrAssgStr} super(data['reference']);
    ${pascal}._(${anonPrivConstrArgStr}{
      ${namedPrivConstrArgStr}
      @required DocumentReference reference,
    }):super(reference);
    ${pascal} copyWith({${cwConstrArgStr}}){return ${pascal}._();}
    ${fieldStr}
  }`;
}

function flatSuf(
  fields: _.Collection<FieldCollectionEntry>,
  fn: (fEntry: FieldCollectionEntry) => string[],
  suffix: string
): string {
  return fields.map(fn).flatMap().map(suf(suffix)).join("");
}

export const importsStr = t`
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flamestore/flamestore.dart';
import 'package:flutter/widgets.dart';
`;
