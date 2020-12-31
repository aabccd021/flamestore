import _ from "lodash";

export function mapPick<T, V extends keyof T>(
  array: _.Collection<T> | T[],
  key: V
): _.Collection<T[V]> {
  return _(array).map(key);
}
