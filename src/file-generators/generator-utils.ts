import pluralize from "pluralize";
import _ from "lodash";
import { CollectionEntry, FieldCollectionEntry } from "./generator-types";

export function toSingularColName(colName: string): string {
  return pluralize.singular(colName);
}
export function toPascalColName(colName: string): string {
  return _.upperFirst(toSingularColName(colName));
}
export function fieldColEntriesOf(
  colEntries: CollectionEntry[]
): _.Collection<FieldCollectionEntry> {
  return _(colEntries)
    .map(({ colName, col }) =>
      col.fields.map(({ fName, field }) => ({
        colName,
        col,
        fName,
        field,
      }))
    )
    .flatMap();
}

type AllowedTypes = string | number | string[] | _.Collection<string>;
export function t(
  strings: TemplateStringsArray,
  ...values: AllowedTypes[]
): string {
  const arrStr = _.range(0, strings.length - 1)
    .map((i) => strings[i] + values[i])
    .join("");
  return arrStr + strings[strings.length - 1];
}

export function suf(suffix: string): (str: string) => string {
  return function _append(str: string): string {
    return str + suffix;
  };
}
