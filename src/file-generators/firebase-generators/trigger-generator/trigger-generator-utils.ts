import _ from "lodash";
import { mapPick } from "../../../lodash-utils";
import { ArrayOr } from "../../../types";
import {
  FieldCollectionEntry,
  isCountField,
  isImageField,
  isPathField,
  isServerTimestampField,
  isSumField,
} from "../../generator-types";
import { getBaseTrigger } from "./get-field-trigger/get-base-trigger";
import { getCountTrigger } from "./get-field-trigger/get-count-trigger";
import { getImageTrigger } from "./get-field-trigger/get-image-trigger";
import { getPathTrigger } from "./get-field-trigger/get-path-trigger";
import { getSumTrigger } from "./get-field-trigger/get-sum-trigger";
import { getTimestampTrigger } from "./get-field-trigger/get-timestamp-trigger";
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
} from "./trigger-generator-templates";
import {
  ProcessedTrigger,
  SchemaTriggerData,
  Trigger,
  TriggerData,
  TriggerType,
} from "./trigger-generator-types";

export function getTriggerStr(param: {
  colName: string;
  triggerType: TriggerType;
  processedTrigger: ProcessedTrigger;
}): string {
  const { colName, triggerType, processedTrigger: trigger } = param;
  const {
    updatedData,
    nonUpdatedData,
    docData,
    resultCommits,
    headerStrs,
    dependencies,
    useDocData,
    useContext,
  } = trigger;

  const suffix = suffixStrOfType(triggerType);
  const snapshotType = snapshotStrOf(triggerType);
  const promiseCallStr = getPromiseCallStr(dependencies);

  const updatedDataStrs = updatedData.map(toUpdatedDataAssignStr);
  const nonUpdatedDataStrs = nonUpdatedData.map(toNonUpdatedDataAssignStr);
  const docDataStr = getDocDataAssignStr({ colName, docData });

  const docDataCommits = getDocDataCommits({
    colName,
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

  const contents: string[] = [
    ...headerStrs,
    promiseCallStr,
    docDataStr,
    ...updatedDataStrs,
    ...nonUpdatedDataStrs,
    batchCommitStr,
  ];
  const contentStr = contents.join("");

  if (contentStr === "") return "";

  const prepareStr = getTriggerPrepareStr({
    triggerType,
    colName,
    useDocData,
  });
  return getTriggerFunctionStr({
    useContext,
    colName,
    triggerType,
    triggerContentStr: prepareStr + contentStr,
  });
}

export function fcEntryToTriggers(fcEntry: FieldCollectionEntry): Trigger[] {
  const { field } = fcEntry;
  const triggers: Trigger[][] = [getBaseTrigger(fcEntry)];
  if (isPathField(field)) triggers.push(getPathTrigger(field, fcEntry));
  if (isCountField(field)) triggers.push(getCountTrigger(field, fcEntry));
  if (isSumField(field)) triggers.push(getSumTrigger(field, fcEntry));
  if (isImageField(field)) triggers.push(getImageTrigger(field, fcEntry));
  if (isServerTimestampField(field))
    triggers.push(getTimestampTrigger(field, fcEntry));
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
  triggers: _.Collection<Trigger>
): ProcessedTrigger {
  const useDocData = triggers.some(({ useDocData }) => useDocData ?? false);
  const useContext = triggers.some(({ useContext }) => useContext ?? false);
  const headers = flatCompact(triggers, "header");
  const docData = mapPick(triggers, "docData").compact().flatMap();
  const resultCommits = flatCompact(triggers, "resultPromise");
  const updatedData = flatCompact(triggers, "updatedData").map(toTriggerData);
  const nonUpdatedData = flatCompact(triggers, "nonUpdatedData").map(
    toTriggerData
  );
  const dependencies = mapPick(triggers, "dependency").compact().flatMap();
  return {
    useDocData,
    useContext,
    dependencies,
    headerStrs: headers,
    resultCommits,
    updatedData,
    nonUpdatedData,
    docData,
  };
}
function toTriggerData(schemaTriggerData: SchemaTriggerData): TriggerData {
  const { dataName } = schemaTriggerData;
  const fields = _.flatMap([schemaTriggerData.field]);
  return { fields, dataName };
}

function flatCompact<T extends { [key: string]: any }, V extends keyof T>(
  array: _.Collection<T> | T[],
  key: V
): _.Truthy<T[V] extends ArrayOr<infer R> ? R : T[V]>[] {
  return mapPick(array, key).compact().flatMap().value();
}
