import _ from "lodash";
import { FlamestoreSchema, CollectionIteration } from "../../type";
import { colIterOf } from "../util";
import { Trigger, TriggerType, TriggerData, FieldTuple } from "./type";

export function filterTrigger(
  triggers: Trigger[],
  colName: string,
  triggerType: TriggerType
): Trigger[] {
  return triggers
    .filter((trigger) => trigger.colName === colName)
    .filter((trigger) => trigger.type === triggerType);
}

export function dataOfTriggers(
  triggers: Trigger[],
  schema: FlamestoreSchema
): {
  useSelfDocData: boolean;
  useContext: boolean;
  updatedData: TriggerData[];
  nonUpdatedData: TriggerData[];
  selfDocData: FieldTuple[];
  commits: string[];
  header: string[];
  dependencies: {
    key: string;
    promise: string;
    colIter: CollectionIteration;
  }[];
} {
  const useSelfDocData = triggers.some(({ useSelfDocData }) => useSelfDocData);
  const useContext = triggers.some(({ useContext }) => useContext);
  const dependencies = _(triggers)
    .map(({ dependency }) => dependency)
    .compact()
    .map((deps) =>
      _([deps])
        .flatMap()
        .map(({ key, colName, promise }) => ({
          key,
          promise,
          colIter: colIterOf(colName, schema),
        }))
        .value()
    )
    .flatMap()
    .value();
  const header = _(triggers)
    .map(({ header }) => header)
    .compact()
    .flatMap()
    .value();
  const commits = _(triggers)
    .map(({ resultPromise }) => resultPromise)
    .compact()
    .flatMap()
    .value();
  const updatedData = _(triggers)
    .map(({ updatedData }) => updatedData)
    .compact()
    .flatMap()
    .value();
  const nonUpdatedData = _(triggers)
    .map(({ nonUpdatedData }) => nonUpdatedData)
    .compact()
    .flatMap()
    .value();
  const selfDocData = _(triggers)
    .map(({ selfDocData }) => selfDocData)
    .compact()
    .flatMap()
    .value();
  return {
    useSelfDocData,
    useContext,
    dependencies,
    header,
    commits,
    updatedData,
    nonUpdatedData,
    selfDocData,
  };
}
