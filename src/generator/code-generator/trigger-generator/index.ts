import { importTemplate } from "./trigger-template";
import { FlamestoreSchema } from "../../utils/interface";
import { getCompleteTriggerMap, stringOfCollectionTrigger } from './utils';
import { countTriggerGenerator } from "./triggers/count-trigger";
import { syncFromTriggerGenerator } from "./triggers/sync-from-trigger";
import { CollectionTriggerMap, TriggerGenerator } from "./interface";
import { sumTriggerGenerator } from "./triggers/sum-trigger";
import { uniqueFieldTriggerGenerator } from "./triggers/unique-field-trigger";
import { serverTimestampTrigger } from "./triggers/server-timestamp-trigger";



export default function getContent(schema: FlamestoreSchema): { [colname: string]: string } {

  const triggerGenerators: TriggerGenerator[] = [
    sumTriggerGenerator,
    countTriggerGenerator,
    syncFromTriggerGenerator,
    serverTimestampTrigger,
    // uniqueKeyTriggerGenerator,
    uniqueFieldTriggerGenerator,
  ];

  const triggerMap = getCompleteTriggerMap(schema, triggerGenerators);

  // let content = '';
  // content += importTemplate;
  // content += stringOfTriggerMap(triggerMap);
  // return content;string
  // for (const [colName, colTriggerMap] of Object.entries(triggerMap)) {
  // return triggerMap.
  const colNameToTrigger: { [colName: string]: string } = {};
  Object.entries(triggerMap)
    .map(([colName, colTriggerMap]) => colNameToTrigger[colName] = stringOfCollectionTrigger(colName, colTriggerMap));
  return colNameToTrigger;
}


