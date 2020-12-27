import _ from "lodash";
import { FlamestoreSchema } from "../../type";
import { colIterOf } from "../util";
import { TriggerData } from "./type";

export function dependencyToColIter(
  {
    key,
    colName,
    promise,
  }: {
    key: string;
    colName: string;
    promise: string;
  },
  schema: FlamestoreSchema
) {
  const colIter = colIterOf(colName, schema);
  return {
    key,
    colIter,
    promise,
  };
}

export function triggerDataToA(
  data: TriggerData[]
): { dataName: string; fields: { fName: string; fValue: string }[] }[] {
  return _(data)
    .map(({ dataName }) => dataName)
    .uniq()
    .map((dataName) => ({
      dataName,
      fields: data
        .filter((d) => d.dataName === dataName)
        .map(({ fName, fValue }) => ({ fName, fValue })),
    }))
    .value();
}
