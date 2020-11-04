import { FieldContent, CollectionContent, FlamestoreSchema } from "../../utils/interface";
import TriggerData from "./trigger-data";



export type TriggerHeaderGenerator = (
  triggerMap: TriggerMap,
  collectionName: string,
) => TriggerMap;



export type TriggerGenerator = (
  triggerMap: TriggerMap,
  collectionName: string,
  collection: CollectionContent,
  fieldName: string,
  field: FieldContent,
  schema: FlamestoreSchema,
) => TriggerMap;

export interface TriggerMap {
  [collectionName: string]: CollectionTriggerMap;
}

export class CollectionTriggerMap {
  createTrigger: TriggerData;
  updateTrigger: TriggerData;
  deleteTrigger: TriggerData;

  constructor(collection: CollectionContent) {
    this.createTrigger = new TriggerData();
    this.updateTrigger = new TriggerData();
    this.deleteTrigger = new TriggerData();
  }
}


export enum TriggerType {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
}
