import _ from "lodash";
import { CollectionEntry, FieldCollectionEntry } from "../generator-types";
import {
  fieldColEntriesOfCol,
  suf,
  t,
  toPascalColName,
} from "../generator-utils";
import {
  toCwAnonConstrAssgStr,
  toCwConstrArgStr,
  toCwNamedConstrAssgStr,
} from "./flutter-class-template/flutter-class-copy-with-constructor-template";
import {
  toConstrArgStr,
  toConstrAssgStr,
} from "./flutter-class-template/flutter-class-default-constructor-template";
import { toFieldStr } from "./flutter-class-template/flutter-class-fields-template";
import { toFromMapConstrAssgStr } from "./flutter-class-template/flutter-class-from-map-constructor-template";
import {
  toAnonPrivConstrArgStr,
  toNamedPrivConstrArgStr,
} from "./flutter-class-template/flutter-class-private-constructor-template";

export function colEntryToStr(colEntry: CollectionEntry): string {
  //
  const { colName } = colEntry;
  const fs = _(fieldColEntriesOfCol(colEntry));
  //
  const pascal = toPascalColName(colName);
  //
  const constructorArgStr = flatSuf(fs, toConstrArgStr, ",");
  const constructorAssgStr = flatSuf(fs, toConstrAssgStr, ",");
  const fieldStr = flatSuf(fs, toFieldStr, ";");
  const fromMapConstrAssgStr = flatSuf(fs, toFromMapConstrAssgStr, ",");
  const anonPrivConstrArgStr = compactSuf(fs, toAnonPrivConstrArgStr, ",");
  const namedPrivConstrArgStr = compactSuf(fs, toNamedPrivConstrArgStr, ",");
  const cwConstrArgStr = compactSuf(fs, toCwConstrArgStr, ",");
  const cwNamedConstrAssgStr = compactSuf(fs, toCwNamedConstrAssgStr, ",");
  const cwAnonConstrAssgStr = compactSuf(fs, toCwAnonConstrAssgStr, ",");
  //
  return t`class ${pascal} extends Document{
    ${pascal}({${constructorArgStr}}): ${constructorAssgStr} super(null);
    ${pascal}._fromMap(Map<String, dynamic> data)
      : ${fromMapConstrAssgStr} super(data['reference']);
    ${pascal}._(${anonPrivConstrArgStr}{
      ${namedPrivConstrArgStr}
      @required DocumentReference reference,
    }):super(reference);
    ${pascal} copyWith({${cwConstrArgStr}}){
      return ${pascal}._(
        ${cwAnonConstrAssgStr}
        ${cwNamedConstrAssgStr}
        reference: this.reference,
      );}
    ${fieldStr}
    @override
    String get colName => "${colName}";
    @override
    List<String> get keys {
      return [];
    }
  }`;
}

function flatSuf(
  fields: _.Collection<FieldCollectionEntry>,
  fn: (fEntry: FieldCollectionEntry) => string[],
  suffix: string
): string {
  return fields.map(fn).flatMap().map(suf(suffix)).join("");
}

function compactSuf(
  fields: _.Collection<FieldCollectionEntry>,
  fn: (fEntry: FieldCollectionEntry) => string | null,
  suffix: string
): string {
  return fields.map(fn).compact().map(suf(suffix)).join("");
}

export const importsStr = t`
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flamestore/flamestore.dart';
import 'package:flutter/widgets.dart';
`;
