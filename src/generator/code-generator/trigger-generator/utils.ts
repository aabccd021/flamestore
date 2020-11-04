import { TriggerMap, CollectionTriggerMap, TriggerGenerator } from "./interface";
import { FlamestoreSchema } from "../../utils/interface";
import { onCreateTemplate, onDeleteTemplate, onUpdateTemplate } from "./trigger-template";
import TriggerData from "./trigger-data";

export function stringOfCollectionTrigger(colName: string, colTriggerMap: CollectionTriggerMap): string {
  let content = '';
  if (!colTriggerMap.createTrigger.isEmpty()) {
    content += onCreateTemplate(
      colName,
      colTriggerMap.createTrigger);
  }
  if (!colTriggerMap.updateTrigger.isEmpty()) {
    content += onUpdateTemplate(
      colName,
      colTriggerMap.updateTrigger);
  }
  if (!colTriggerMap.deleteTrigger.isEmpty()) {
    content += onDeleteTemplate(
      colName,
      colTriggerMap.deleteTrigger);
  }
  return content;
}


export function getCompleteTriggerMap(schema: FlamestoreSchema, triggerGenerators: TriggerGenerator[]): TriggerMap {
  let triggerMap: TriggerMap = {};
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    triggerMap[collectionName] = new CollectionTriggerMap(collection);
  }
  for (const triggerGenerator of triggerGenerators) {
    for (const [collectionName, collection] of Object.entries(schema.collections)) {
      for (const [fieldName, field] of Object.entries(collection.fields)) {
        triggerMap = triggerGenerator(
          triggerMap,
          collectionName,
          collection,
          fieldName,
          field,
          schema,
        );
      }
    }
  }
  return triggerMap;
}


