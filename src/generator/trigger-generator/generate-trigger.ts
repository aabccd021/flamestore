import _ from "lodash";
import { CollectionIteration } from "../../type";
import {
  dataAssignment,
  dataNameOfTriggerType,
  dataSuffixOfTriggerType,
  getBatchCommitString,
  getPromisesString,
  thisDataAssignment,
  triggerPrepareString,
  triggerTemplate,
  updateData as getUpdateData,
  updateThisData,
} from "./templates";
import { Trigger, TriggerType } from "./type";
import { dependencyToColIter, triggerDataToA } from "./utils";

export function getTriggerString(
  { pascalColName, colName, schema }: CollectionIteration,
  triggerType: TriggerType,
  triggers: Trigger[]
): string {
  const suffix = dataSuffixOfTriggerType(triggerType);
  const useContext = triggers.some(({ useContext }) => useContext);
  const dependencies = _(triggers)
    .map(({ dependencies }) => dependencies)
    .compact()
    .map((deps) => deps.map((dep) => dependencyToColIter(dep, schema)))
    .flatMap()
    .value();
  const header = _(triggers)
    .map(({ header }) => header)
    .compact()
    .flatMap()
    .value();
  const promiseCommits = _(triggers)
    .map(({ resultPromises }) => resultPromises)
    .compact()
    .flatMap()
    .value();
  const data = _(triggers)
    .map(({ data }) => data)
    .compact()
    .flatMap()
    .value();
  const nonUpdateData = _(triggers)
    .map(({ nonUpdateData }) => nonUpdateData)
    .compact()
    .flatMap()
    .value();
  const thisData = _(triggers)
    .map(({ thisData }) => thisData)
    .compact()
    .flatMap()
    .value();
  const dataString = triggerDataToA(data).map(dataAssignment);
  const nonUpdateDataString = triggerDataToA(nonUpdateData).map(dataAssignment);
  const hasThisData = thisData.length !== 0;
  const thisDataString = hasThisData
    ? thisDataAssignment({ fields: thisData })
    : "";
  const thisDataCommits = hasThisData ? [updateThisData(suffix)] : [];
  const dataType = dataNameOfTriggerType(triggerType);
  const dataCommits = _(data)
    .map(({ dataName }) => getUpdateData(dataType, dataName))
    .value();
  const commits = [...thisDataCommits, ...dataCommits, ...promiseCommits];
  const contentWithoutPrepare =
    header +
    getPromisesString(dependencies) +
    thisDataString +
    dataString +
    nonUpdateDataString +
    getBatchCommitString({ commits });
  const useThisData = _(triggers).some(
    ({ useThisData }) => useThisData ?? false
  );
  const prepareTrigger = useThisData
    ? triggerPrepareString({ triggerType, pascalColName })
    : "";
  const content =
    contentWithoutPrepare === "" ? "" : prepareTrigger + contentWithoutPrepare;

  return triggerTemplate({
    useContext,
    colName,
    triggerType,
    content,
  });
}
