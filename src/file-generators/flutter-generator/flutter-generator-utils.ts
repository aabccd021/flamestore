import {
  Field,
  CountField,
  ServerTimestampField,
  SumField,
  DynamicLinkField,
} from "../generator-types";

export function isConstrArgRequired(
  field: Exclude<
    Field,
    CountField | ServerTimestampField | SumField | DynamicLinkField
  >
): boolean {
  if (field.isOptional) return false;
  return true;
}
