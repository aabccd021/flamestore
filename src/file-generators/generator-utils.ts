import pluralize from "pluralize";
import _ from "lodash";
import {
  CollectionEntry,
  Field,
  FieldCollectionEntry,
  FieldEntry,
} from "./generator-types";

export function toSingularColName(colName: string): string {
  return pluralize.singular(colName);
}
export function toPascalColName(colName: string): string {
  return _.upperFirst(toSingularColName(colName));
}
export function fieldColEntriesOf(
  colEntries: CollectionEntry[]
): _.Collection<FieldCollectionEntry> {
  return _(colEntries).map(fieldColEntriesOfCol).flatMap();
}
export function fieldColEntriesOfCol(
  colEntry: CollectionEntry
): FieldCollectionEntry[] {
  return colEntry.col.fields
    .map((field) => ({ ...field, ...colEntry }))
    .value();
}

type StrOrNum = string | number;
type AllowedTypes = string | number | string[] | _.Collection<string>;
export function t(
  strings: TemplateStringsArray,
  ...values: AllowedTypes[]
): string {
  const processedValues: StrOrNum[] = values.map((x) => {
    if (_.isArray(x)) return x.join("");
    if (_.isString(x)) return x;
    if (_.isNumber(x)) return x;
    return x.join("");
  });
  const arrStr: string = _.range(0, strings.length - 1)
    .map((i) => strings[i] + processedValues[i])
    .join("");
  return arrStr + strings[strings.length - 1];
}

export function suf(suffix: string): (str: string) => string {
  return function _append(str: string): string {
    return str + suffix;
  };
}
export function pref(prefix: string): (str: string) => string {
  return function _prepend(str: string): string {
    return prefix + str;
  };
}
export function sur(prefix: string, suffix: string): (str: string) => string {
  return function _append(str: string): string {
    return prefix + str + suffix;
  };
}

export function filterMap(
  fields: _.Collection<FieldEntry>,
  filter: (field: Field) => boolean,
  map: (fName: string) => string
): _.Collection<string> {
  return fields
    .filter(({ field }) => filter(field))
    .map(({ fName }) => map(fName));
}

export function nilOr<T>(val: T | undefined, fn: (val: T) => string): string {
  if (_.isNil(val)) return "";
  return fn(val);
}

export function emptyOr(
  strs: _.Collection<string>,
  fn: (str: _.Collection<string>) => string
): string {
  if (strs.isEmpty()) return "";
  return fn(strs);
}

export function mapPick<T, V extends keyof T>(
  array: _.Collection<T> | T[],
  key: V
): _.Collection<T[V]> {
  return _(array).map(key);
}
