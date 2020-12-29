import _ from "lodash";
import { ArrayOr, FieldIteration, FlamestoreSchema } from "../../type";
import {
  isTypeReference,
  isTypeCount,
  isTypeImage,
  isTypeSum,
  colIterOf,
  mapPick,
} from "../util";
import { baseTriggerGenerator } from "./field-trigger/base";
import { countTriggerGenerator } from "./field-trigger/count";
import { imageTriggerGenerator } from "./field-trigger/image";
import { pathTriggerGenerator } from "./field-trigger/path";
import { sumTriggerGenerator } from "./field-trigger/sum";
import { timestampTriggerGenerator } from "./field-trigger/timestamp";
import {
  getBatchCommitStr,
  getPromiseCallStr,
  getTriggerPrepareStr,
  toNonUpdatedDataAssignStr,
  suffixStrOfType,
  toUpdatedDataAssignStr,
  getDocDataAssignStr,
  snapshotStrOf,
  getTriggerFunctionStr,
  getDocDataCommits,
  getUpdateUpdatedDataStr,
} from "./templates";
import { ProcessedTrigger, Trigger, TriggerType } from "./types";

export function getTriggerStr(param: {
  colName: string;
  pascalColName: string;
  singularColName: string;
  triggerType: TriggerType;
  processedTrigger: ProcessedTrigger;
}): string {
  const {
    colName,
    pascalColName,
    singularColName,
    triggerType,
    processedTrigger: trigger,
  } = param;
  const {
    updatedData,
    nonUpdatedData,
    docData,
    resultCommits,
    headers,
    dependencies,
    useDocData,
    useContext,
  } = trigger;

  // prepare easy variables
  const suffix = suffixStrOfType(triggerType);
  const snapshotType = snapshotStrOf(triggerType);
  const promiseCallStr = getPromiseCallStr(dependencies);
  const headerStr = headers.join("");

  // get datas string
  const updatedDataStr = updatedData.map(toUpdatedDataAssignStr).join("");
  const nonUpdatedDataStr = nonUpdatedData
    .map(toNonUpdatedDataAssignStr)
    .join("");
  const docDataStr = getDocDataAssignStr({ singularColName, docData });

  // get commits string
  const docDataCommits = getDocDataCommits({
    singularColName,
    suffix,
    docData,
  });
  const updatedDataCommits = updatedData.map(({ dataName }) =>
    getUpdateUpdatedDataStr(snapshotType, dataName)
  );
  const batchCommitStr = getBatchCommitStr([
    ...docDataCommits,
    ...updatedDataCommits,
    ...resultCommits,
  ]);

  // get all contents string
  const contents: string[] = [
    headerStr,
    promiseCallStr,
    docDataStr,
    updatedDataStr,
    nonUpdatedDataStr,
    batchCommitStr,
  ];
  const contentStr = contents.join("");

  // return if content empty, no need to add trigger prepare string
  if (contentStr === "") return "";

  const prepareStr = getTriggerPrepareStr({
    triggerType,
    pascalColName,
    useDocData,
  });
  return getTriggerFunctionStr({
    useContext,
    colName,
    triggerType,
    triggerContentStr: prepareStr + contentStr,
  });
}

export function toTriggers(fIter: FieldIteration): Trigger[] {
  const { field } = fIter;
  const triggers: Trigger[][] = [baseTriggerGenerator(fIter)];
  if (isTypeReference(field)) {
    triggers.push(pathTriggerGenerator(field, fIter));
  }
  if (isTypeCount(field)) {
    triggers.push(countTriggerGenerator(field, fIter));
  }
  if (isTypeSum(field)) {
    triggers.push(sumTriggerGenerator(field, fIter));
  }
  if (isTypeImage(field)) {
    triggers.push(imageTriggerGenerator(field, fIter));
  }
  if (field === "serverTimestamp") {
    triggers.push(timestampTriggerGenerator(field, fIter));
  }
  return _.flatMap(triggers);
}

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
): ProcessedTrigger {
  const useDocData = triggers.some(({ useDocData }) => useDocData ?? false);
  const useContext = triggers.some(({ useContext }) => useContext ?? false);
  const headers = flatCompact(triggers, "header");
  const docData = flatCompact(triggers, "docData");
  const resultCommits = flatCompact(triggers, "resultPromise");
  const updatedData = flatCompact(triggers, "updatedData");
  const nonUpdatedData = flatCompact(triggers, "nonUpdatedData");
  const dependencies = mapPick(triggers, "dependency")
    .compact()
    .map((deps) =>
      _([deps])
        .flatMap()
        .map(({ key, colName, fName }) => ({
          key,
          fName,
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

function flatCompact<T extends { [key: string]: any }, V extends keyof T>(
  array: _.Collection<T> | T[],
  key: V
): _.Truthy<T[V] extends ArrayOr<infer R> ? R : T[V]>[] {
  return mapPick(array, key).compact().flatMap().value();
}
