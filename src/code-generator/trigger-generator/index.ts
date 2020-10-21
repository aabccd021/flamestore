import { importTemplate } from "./trigger-template";
import { Schema } from "../../utils/interface";
import { stringOfTriggerMap, getCompleteTriggerMap as getTriggerMapOfSchema } from './utils';
import { countTriggerGenerator } from "./triggers/count-trigger";
import { syncFromTriggerGenerator } from "./triggers/sync-from-trigger";
import { TriggerGenerator } from "./interface";
import { sumTriggerGenerator } from "./triggers/sum-trigger";
import { uniqueKeyTriggerGenerator } from "./triggers/unique-key-trigger";
import { uniqueFieldTriggerGenerator } from "./triggers/unique-field-trigger";
import { defaultFieldTriggerGenerator } from "./triggers/default-field-trigger";



export default function getContent(schema: Schema): string {

  const triggerGenerators: TriggerGenerator[] = [
    sumTriggerGenerator,
    countTriggerGenerator,
    syncFromTriggerGenerator,
    defaultFieldTriggerGenerator,
    // uniqueKeyTriggerGenerator,
    uniqueFieldTriggerGenerator,
  ];

  const triggerMap = getTriggerMapOfSchema(schema, triggerGenerators);

  let content = '';
  content += importTemplate;
  content += stringOfTriggerMap(triggerMap);
  return content;
}


