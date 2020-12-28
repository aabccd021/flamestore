import _ from "lodash";
import { FlamestoreSchema, CollectionIteration } from "../../type";
import { colIterOf, mapPick } from "../util";
import { Trigger, TriggerType, TriggerData, FieldTuple } from "./type";

export function filterTrigger(
  triggers: _.Collection<Trigger>,
  colName: string,
  triggerType: TriggerType
): _.Collection<Trigger> {
  return triggers
    .filter((trigger) => trigger.colName === colName)
    .filter((trigger) => trigger.type === triggerType);
}

export function dataOfTriggers(
  triggers: _.Collection<Trigger>,
  schema: FlamestoreSchema
): {
  useDocData: boolean;
  useContext: boolean;
  updatedData: TriggerData[];
  nonUpdatedData: TriggerData[];
  docData: FieldTuple[];
  resultCommits: string[];
  headers: string[];
  dependencies: {
    key: string;
    promise: string;
    colIter: CollectionIteration;
  }[];
} {
  const useDocData = triggers.some(({ useDocData }) => useDocData ?? false);
  const useContext = triggers.some(({ useContext }) => useContext ?? false);
  const headers = mapPick(triggers, "header").compact().flatMap().value();
  const docData = mapPick(triggers, "docData").compact().flatMap().value();
  const resultCommits = mapPick(triggers, "resultPromise")
    .compact()
    .flatMap()
    .value();
  const updatedData = mapPick(triggers, "updatedData")
    .compact()
    .flatMap()
    .value();
  const nonUpdatedData = mapPick(triggers, "nonUpdatedData")
    .compact()
    .flatMap()
    .value();
  const dependencies = mapPick(triggers, "dependency")
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

  return {
    useDocData,
    useContext,
    dependencies,
    headers,
    resultCommits,
    updatedData,
    nonUpdatedData,
    docData,
  };
}
