export interface FlamestoreSchema {
  collections: Collections;
  configuration: FlamestoreConfig;
}

export interface FlamestoreConfig {
  ruleOutputPath: string;
  triggerOutputPath: string;
  region: string;
}

export interface Collections {
  [name: string]: Collection;
}

export interface Collection {
  fields: Fields;
  rules: Rules;
}

export interface Rules {
  [RuleType.GET]?: Rule;
  [RuleType.LIST]?: Rule;
  [RuleType.CREATE]?: Rule;
  [RuleType.UPDATE]?: Rule;
  [RuleType.DELETE]?: Rule;
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

interface Fields {
  [name: string]: Field;
}

export interface Field {
  type?: FieldType;
  isKey?: boolean;
  isUnique?: boolean;
  isOptional?: boolean;
  sum?: Sum;
  count?: Count;
  syncFrom?: SyncFrom;
}

export interface Sum {
  collection: string,
  field: string,
  reference: string,
}

export interface Count {
  collection: string,
  reference: string,
}

interface SyncFrom {
  field: string,
  reference: string,
}

export interface FieldType {
  [FieldTypes.STRING]?: StringField,
  [FieldTypes.DATETIME]?: DatetimeField,
  [FieldTypes.PATH]?: ReferenceField,
  [FieldTypes.INT]?: IntField,
}

interface StringField {
  isOwnerUid?: boolean,
  minLength?: number,
  maxLength?: number,
}

export interface DatetimeField {
  serverTimestamp?: boolean,
}


export interface ReferenceField {
  collection: string,
  isOwnerDocRef?: boolean,
}

export interface IntField {
  min?: number,
  max?: number,
  deleteDocWhen?: number,
}

export enum FieldTypes {
  INT = 'int',
  STRING = 'string',
  PATH = 'path',
  DATETIME = 'timestamp'
}

export interface FlamestoreModule {
  validateRaw?: (rawSchema: any) => void,
  validate?: (schema: FlamestoreSchema) => void,
  ruleFunction?: (collection: Collection) => string[],
  getRule?: (fieldName: string, field: Field) => string[],
  triggerGenerator?: TriggerGenerator,
}

export type TriggerHeaderGenerator = (
  triggerMap: TriggerMap,
  collectionName: string,
) => TriggerMap;



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


export enum TriggerType {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
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

export interface UpdateData {
  [dataName: string]: UpdateFieldData;
}

export interface UpdateFieldData {
  [fieldName: string]: { fieldValue: string, fieldCondition?: string }
}