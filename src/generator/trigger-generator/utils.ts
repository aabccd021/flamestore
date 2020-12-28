import _ from "lodash";
import { CollectionIteration, FlamestoreSchema } from "../../type";
import { colIterOf } from "../util";
import { Trigger, TriggerData, FieldTuple, TriggerType } from "./type";

export function filterTrigger(
  triggers: Trigger[],
  colName: string,
  triggerType: TriggerType
): Trigger[] {
  return triggers
    .filter((trigger) => trigger.colName === colName)
    .filter((trigger) => trigger.triggerType === triggerType);
}

export function dataOfTriggers(
  triggers: Trigger[],
  schema: FlamestoreSchema
): {
  useThisData: boolean;
  useContext: boolean;
  data: TriggerData[];
  nonUpdateData: TriggerData[];
  thisData: FieldTuple[];
  promiseCommits: string[];
  header: string[];
  dependencies: {
    key: string;
    promise: string;
    colIter: CollectionIteration;
  }[];
} {
  const useThisData = triggers.some(({ useThisData }) => useThisData);
  const useContext = triggers.some(({ useContext }) => useContext);
  const dependencies = _(triggers)
    .map(({ dependencies }) => dependencies)
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
  const header = _(triggers).map("header").compact().flatMap().value();
  const promiseCommits = _(triggers)
    .map("resultPromises")
    .compact()
    .flatMap()
    .value();
  const data = _(triggers).map("data").compact().flatMap().value();
  const nonUpdateData = _(triggers)
    .map("nonUpdateData")
    .compact()
    .flatMap()
    .value();
  const thisData = _(triggers).map("thisData").compact().flatMap().value();
  return {
    useThisData,
    useContext,
    dependencies,
    header,
    promiseCommits,
    data,
    nonUpdateData,
    thisData,
  };
}
