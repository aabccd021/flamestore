import { TriggerMap, CollectionTriggerMap, TriggerGenerator } from "./interface";
import { Schema } from "../../utils/interface";
import { onCreateTemplate, onDeleteTemplate, onUpdateTemplate } from "./trigger-template";
import TriggerData from "./trigger-data";

export function stringOfTriggerMap(triggerMap: TriggerMap): string {
  let content = '';
  for (const [colName, colTriggerMap] of Object.entries(triggerMap)) {
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
  }
  return content;
}


export function getCompleteTriggerMap(schema: Schema, triggerGenerators: TriggerGenerator[]): TriggerMap {
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


