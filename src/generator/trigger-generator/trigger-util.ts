import _ from "lodash";
import { CollectionIteration, FieldIteration } from "../../type";
import { isTypeReference, isTypeCount, isTypeImage, isTypeSum } from "../util";
import { baseTriggerGenerator } from "./field-trigger-generator/base";
import { countTriggerGenerator } from "./field-trigger-generator/count";
import { imageTriggerGenerator } from "./field-trigger-generator/image";
import { pathTriggerGenerator } from "./field-trigger-generator/path";
import { sumTriggerGenerator } from "./field-trigger-generator/sum";
import { timestampTriggerGenerator } from "./field-trigger-generator/timestamp";
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
import { Trigger, TriggerType } from "./type";
import { dataOfTriggers, filterTrigger } from "./utils";

export function getTriggerStr(
  colIter: CollectionIteration,
  triggerType: TriggerType,
  allTriggers: Trigger[]
): string {
  const { pascalColName, colName, schema } = colIter;

  // filter
  const triggers = filterTrigger(allTriggers, colName, triggerType);

  // extract data from triggers
  const {
    updatedData,
    nonUpdatedData,
    docData,
    resultCommits,
    header,
    dependencies,
    useSelfDocData,
    useContext,
  } = dataOfTriggers(triggers, schema);

  const suffix = suffixStrOfType(triggerType);
  const snapshotStr = snapshotStrOf(triggerType);
  const promiseCallStr = getPromiseCallStr(dependencies);

  // get data strings
  const updatedDataStr = updatedData.map(toUpdatedDataAssignStr);
  const nonUpdatedDataStr = nonUpdatedData.map(toNonUpdatedDataAssignStr);
  const docDataStr = getDocDataAssignStr(colIter, docData);

  // commits
  const docDataCommits = getDocDataCommits(colIter, suffix, docData);
  const updatedDataCommits = updatedData.map(({ dataName }) =>
    getUpdateUpdatedDataStr(snapshotStr, dataName)
  );
  const batchCommitStr = getBatchCommitStr([
    ...docDataCommits,
    ...updatedDataCommits,
    ...resultCommits,
  ]);

  const contentStr = [
    header,
    promiseCallStr,
    docDataStr,
    updatedDataStr,
    nonUpdatedDataStr,
    batchCommitStr,
  ].join("");
  if (contentStr === "") return "";

  const prepareStr = getTriggerPrepareStr({
    triggerType,
    pascalColName,
    useDocData: useSelfDocData,
  });
  return getTriggerFunctionStr({
    useContext,
    colName,
    triggerType,
    contentStr: prepareStr + contentStr,
  });
}

export function toTrigger(fIter: FieldIteration): Trigger[] {
  const { field } = fIter;
  const triggers = [
    baseTriggerGenerator(fIter),
    isTypeReference(field) ? pathTriggerGenerator(field, fIter) : [],
    isTypeCount(field) ? countTriggerGenerator({ field, fIter }) : [],
    isTypeImage(field) ? imageTriggerGenerator(field, fIter) : [],
    isTypeSum(field) ? sumTriggerGenerator(field, fIter) : [],
    field === "serverTimestamp" ? timestampTriggerGenerator(field, fIter) : [],
  ];
  return _(triggers).flatMap().value();
}
