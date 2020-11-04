import { FieldContent, Collection, FlamestoreSchema } from "../../types/schema";
import TriggerData from "./trigger-data";



export type TriggerHeaderGenerator = (
  triggerMap: TriggerMap,
  collectionName: string,
) => TriggerMap;



export type TriggerGenerator = (
  triggerMap: TriggerMap,
  collectionName: string,
  collection: Collection,
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

  constructor(collection: Collection) {
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
