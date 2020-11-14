export interface FlamestoreSchema {
  '$schema': string;
  collections: { [name: string]: Collection };
  configuration: {
    ruleOutputPath?: string;
    triggerOutputPath?: string;
    region: string;
  };
}

export interface Collection {
  fields: { [name: string]: Field };
  rules: {
    [key in RuleType]?: Rule
  };
}


export enum FieldTypes {
  INT = 'int',
  FLOAT = 'float',
  STRING = 'string',
  PATH = 'path',
  DATETIME = 'timestamp'
}

export enum RuleType {
  GET = "get",
  LIST = "list",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete"
}

export enum Rule {
  ALL = "all",
  OWNER = "owner",
  AUTHENTICATED = "authenticated",
  NONE = "none"
}

export interface Field {
  property?: FieldProperty,
  type: FieldType,
}

export type FieldType = StringField
  | FloatField
  | ReferenceField
  | IntField
  | DatetimeField
  | SumField
  | CountField
  | SyncFromField;

export type FieldProperty = Computed | NonComputed;

export interface Computed {
  isComputed?: boolean;
}

export interface NonComputed {
  isUnique?: boolean;
  isOptional?: boolean;
  rules?: {
    isCreatable?: boolean,
    isUpdatable?: boolean,
  };
}

export interface SumField {
  sum: {
    collection: string,
    field: string,
    reference: string,
  };
}

export interface CountField {
  count: {
    collection: string,
    reference: string,
  };
}

export interface SyncFromField {
  syncFrom: {
    field: string,
    reference: string,
  };
}

export const SYNC_FROM = 'syncFrom';

export interface StringField {
  string: {
    isKey?: boolean;
    isOwnerUid?: boolean,
    minLength?: number,
    maxLength?: number,
  }
}

export interface DatetimeField {
  timestamp: {
    serverTimestamp?: boolean,
  }
}


export interface ReferenceField {
  path: {
    isKey?: boolean;
    collection: string,
    isOwnerDocRef?: boolean,
  }
}

export interface IntField {
  int: {
    min?: number,
    max?: number,
    deleteDocWhen?: number,
  }
}

export interface FloatField {
  float: {
    min?: number,
    max?: number,
    deleteDocWhen?: number,
  }
}


export interface FlamestoreModule {
  validateRaw?: (rawSchema: any) => void,
  validate?: (schema: FlamestoreSchema) => void,
  ruleFunction?: (collection: Collection) => string[],
  getRule?: (fieldName: string, field: Field) => string[],
  triggerGenerator?: TriggerGenerator,
  isCreatable?: (field: Field) => boolean;
  isUpdatable?: (field: Field) => boolean;
  isCreatableOverride?: (field: Field) => boolean | undefined;
  isUpdatableOverride?: (field: Field) => boolean | undefined;
  isPrimitive?: (field: Field) => boolean;
}

export type TriggerGenerator = (
  triggerMap: TriggerMap,
  collectionName: string,
  collection: Collection,
  fieldName: string,
  field: Field,
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

export class TriggerData {
  _header = '';
  dependencyPromises: { [dependencyName: string]: { collection: string, promise: string } } = {};
  _resultPromises: string[] = [];
  _data: UpdateData = {};
  _nonUpdateData: UpdateData = {};

  addData(dataName: string, fieldName: string, fieldValue: string, fieldCondition?: string) {
    if (!Object.keys(this._data).includes(dataName)) {
      this._data[dataName] = {};
    }
    this._data[dataName][fieldName] = { fieldValue, fieldCondition };
  }
  addNonUpdateData(dataName: string, fieldName: string, fieldValue: string, fieldCondition?: string) {
    if (!Object.keys(this._nonUpdateData).includes(dataName)) {
      this._nonUpdateData[dataName] = {};
    }
    this._nonUpdateData[dataName][fieldName] = { fieldValue, fieldCondition };
  }
  addHeader(content: string) {
    if (!this._header.includes(content)) {
      this._header += content;
    }
  }
  addResultPromise(content: string) {
    if (!this._resultPromises.join('').includes(content)) {
      this._resultPromises.push(content);
    }
  }
  isEmpty(): boolean {
    return this._header === ''
      && Object.keys(this.dependencyPromises).length === 0
      && this._resultPromises.join('') === ''
      && Object.keys(this._data).length === 0
      && Object.keys(this._nonUpdateData).length === 0;
  }
}

interface UpdateData {
  [dataName: string]: UpdateFieldData;
}

export interface UpdateFieldData {
  [fieldName: string]: { fieldValue: string, fieldCondition?: string }
}