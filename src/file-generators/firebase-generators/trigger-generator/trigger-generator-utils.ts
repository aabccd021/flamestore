import _ from "lodash";
import { mapPick } from "../../../lodash-utils";
import { ArrayOr } from "../../../types";
import {
  FieldCollectionEntry,
  isCountField,
  isImageField,
  isPathField,
  isServerTimestampField as isServerTimeField,
  isSumField,
} from "../../generator-types";
import { getBaseTrigger } from "./get-field-trigger/get-base-trigger";
import { getCountTrigger } from "./get-field-trigger/get-count-trigger";
import { getImageTrigger } from "./get-field-trigger/get-image-trigger";
import { getPathTrigger } from "./get-field-trigger/get-path-trigger";
import { getSumTrigger } from "./get-field-trigger/get-sum-trigger";
import { getServerTimestampTrigger as getServerTimeTrigger } from "./get-field-trigger/get-timestamp-trigger";
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

  if (_.isEmpty(contentStr)) return "";

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

export function fcEntryToTriggers(fcE: FieldCollectionEntry): Trigger[] {
  const { field } = fcE;
  const triggers: Trigger[][] = [getBaseTrigger(fcE)];
  if (isPathField(field)) triggers.push(getPathTrigger(field, fcE));
  if (isCountField(field)) triggers.push(getCountTrigger(field, fcE));
  if (isSumField(field)) triggers.push(getSumTrigger(field, fcE));
  if (isImageField(field)) triggers.push(getImageTrigger(field, fcE));
  if (isServerTimeField(field)) triggers.push(getServerTimeTrigger(field, fcE));
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
  const headerStrs = flatComp(triggers, "header");
  const docData = mapPick(triggers, "docData").compact().flatMap();
  const resultCommits = flatComp(triggers, "resultPromise");
  const updatedData = flatComp(triggers, "updatedData").map(toTriggerD);
  const nonUpdatedData = flatComp(triggers, "nonUpdatedData").map(toTriggerD);
  const dependencies = mapPick(triggers, "dependency").compact().flatMap();
  return {
    useDocData,
    useContext,
    dependencies,
    headerStrs,
    resultCommits,
    updatedData,
    nonUpdatedData,
    docData,
  };
}
function toTriggerD(schemaTriggerData: SchemaTriggerData): TriggerData {
  const { dataName } = schemaTriggerData;
  const fields = _.flatMap([schemaTriggerData.field]);
  return { fields, dataName };
}

function flatComp<T extends { [key: string]: any }, V extends keyof T>(
  array: _.Collection<T> | T[],
  key: V
): _.Truthy<T[V] extends ArrayOr<infer R> ? R : T[V]>[] {
  return mapPick(array, key).compact().flatMap().value();
}
