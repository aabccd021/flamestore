import _ from "lodash";
import { CollectionIteration, FieldIteration, FlamestoreSchema } from "../type";

export interface CollectionTriggerMap {
  createTrigger: TriggerData;
  updateTrigger: TriggerData;
  deleteTrigger: TriggerData;
}

export interface TriggerData {
  useContext: boolean;
  [x: string]: any;
  header: string[];
  dependencyPromises: {
    [dependencyName: string]: { collection: string; promise: string };
  };
  resultPromises: string[];
  data: { [dataName: string]: UpdateFieldData };
  nonUpdateData: { [dataName: string]: UpdateFieldData };
}

function getEmptyTriggerData(): TriggerData {
  return {
    useContext: false,
    header: [],
    dependencyPromises: {},
    resultPromises: [],
    data: {},
    nonUpdateData: {},
  };
}

export function getEmptyCollectionTriggerMap(): CollectionTriggerMap {
  return {
    createTrigger: getEmptyTriggerData(),
    updateTrigger: getEmptyTriggerData(),
    deleteTrigger: getEmptyTriggerData(),
  };
}

export function addTriggerData(
  triggerData: TriggerData,
  dataName: string,
  fieldName: string,
  fieldValue: string
): TriggerData {
  if (!_(triggerData.data).keys().includes(dataName)) {
    triggerData.data[dataName] = {};
  }
  triggerData.data[dataName][fieldName] = { fieldValue };
  return triggerData;
}

export function addTriggerNonUpdateData(
  triggerData: TriggerData,
  dataName: string,
  fieldName: string,
  fieldValue: string
): TriggerData {
  if (!_(triggerData.nonUpdateData).keys().includes(dataName)) {
    triggerData.nonUpdateData[dataName] = {};
  }
  triggerData.nonUpdateData[dataName][fieldName] = {
    fieldValue,
  };
  return triggerData;
}
export function addTriggerHeader(
  triggerData: TriggerData,
  content: string
): TriggerData {
  if (!triggerData.header.join("").includes(content)) {
    triggerData.header.push(content);
  }
  return triggerData;
}
export function addTriggerContent(
  triggerData: TriggerData,
  content: string
): TriggerData {
  if (!triggerData.content.join("").includes(content)) {
    triggerData.content.push(content);
  }
  return triggerData;
}

export function addResultPromise(
  triggerData: TriggerData,
  content: string
): TriggerData {
  if (!triggerData.resultPromises.join("").includes(content)) {
    triggerData.resultPromises.push(content);
  }
  return triggerData;
}
export function isTriggerDataEmpty(triggerData: TriggerData): boolean {
  return (
    !triggerData.header?.length &&
    _.isEmpty(triggerData.dependencyPromises) &&
    !triggerData.resultPromises?.length &&
    _.isEmpty(triggerData.data) &&
    _.isEmpty(triggerData.nonUpdateData)
  );
}

export interface UpdateFieldData {
  [fieldName: string]: { fieldValue: string };
}

export type TriggerGenerator = (
  triggerMap: TriggerMap,
  fIter: FieldIteration
) => TriggerMap;

export interface TriggerMap {
  [collectionName: string]: CollectionTriggerMap;
}

export interface FlamestoreModule {
  validateRaw?: (rawSchema: unknown) => void;
  validate?: (schema: FlamestoreSchema) => void;
  ruleFunction?: (colIter: CollectionIteration) => string[];
  getRule?: (fIter: FieldIteration) => string[];
  triggerGenerator?: TriggerGenerator;
  isCreatable?: (fIter: FieldIteration) => boolean;
  isUpdatable?: (fIter: FieldIteration) => boolean;
  isNotCreatable?: (fIter: FieldIteration) => boolean;
  isNotUpdatable?: (fIter: FieldIteration) => boolean;
  isPrimitive?: (fIter: FieldIteration) => boolean;
  isObject?: (fIter: FieldIteration) => boolean;
  preprocessSchema?: (schema: FlamestoreSchema) => FlamestoreSchema;
}
