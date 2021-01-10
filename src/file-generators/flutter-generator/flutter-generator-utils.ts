import { FieldCollectionEntry } from "../generator-types";
import { suf } from "../generator-utils";

export function flatSuf(
  fields: _.Collection<FieldCollectionEntry>,
  fn: (fEntry: FieldCollectionEntry) => string[],
  suffix: string
): string {
  return fields.map(fn).flatMap().map(suf(suffix)).join("");
}

export function compactSuf(
  fields: _.Collection<FieldCollectionEntry>,
  fn: (fEntry: FieldCollectionEntry) => string | null,
  suffix: string
): string {
  return fields.map(fn).compact().map(suf(suffix)).join("");
}
