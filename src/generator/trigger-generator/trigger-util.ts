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
  batchCommitT,
  promisesT,
  triggerPrepareT,
  triggerT,
  updateDataT as getUpdateData,
  updateThisDataT,
  toNonUpdateDataAssignStr,
  suffixStrOfType,
  toDataAssignStr,
  thisDataAssignStrOf,
  snapshotNameOf,
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
    data,
    nonUpdateData,
    thisData,
    promiseCommits,
    header,
    dependencies,
    useThisData,
    useContext,
  } = dataOfTriggers(triggers, schema);

  const suffix = suffixStrOfType(triggerType);
  const dataString = data.map(toDataAssignStr);
  const nonUpdateDataString = nonUpdateData.map(toNonUpdateDataAssignStr);
  const thisDataString = thisDataAssignStrOf(colIter, thisData);
  const thisDataCommits = updateThisDataT(colIter, suffix, thisData);
  const snapshotDataName = snapshotNameOf(triggerType);
  const dataCommits = data.map(({ dataName }) =>
    getUpdateData(snapshotDataName, dataName)
  );
  const commits = [...thisDataCommits, ...dataCommits, ...promiseCommits];
  const contentWOPrepare = [
    header,
    promisesT(dependencies),
    thisDataString,
    dataString,
    nonUpdateDataString,
    batchCommitT({ commits }),
  ].join("");
  const prepare = triggerPrepareT({ triggerType, pascalColName, useThisData });
  const content = contentWOPrepare === "" ? "" : prepare + contentWOPrepare;
  return triggerT({ useContext, colName, triggerType, content });
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
