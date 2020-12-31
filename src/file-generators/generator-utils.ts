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
