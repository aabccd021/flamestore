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
  allTriggers: _.Collection<Trigger>
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
    headers,
    dependencies,
    useDocData,
    useContext,
  } = dataOfTriggers(triggers, schema);

  // prepare easy variables
  const suffixType = suffixStrOfType(triggerType);
  const snapshotType = snapshotStrOf(triggerType);
  const promiseCallStr = getPromiseCallStr(dependencies);
  const headerStr = headers.join("");

  // get datas string
  const updatedDataStr = updatedData.map(toUpdatedDataAssignStr).join("");
  const nonUpdatedDataStr = nonUpdatedData
    .map(toNonUpdatedDataAssignStr)
    .join("");
  const docDataStr = getDocDataAssignStr(colIter, docData);

  // get commits string
  const docDataCommits = getDocDataCommits(colIter, suffixType, docData);
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
