export interface FlamestoreSchema {
  $schema: string;
  authentication?: { userCollection: string; uidField: string };
  collections: { [name: string]: Collection };
  ruleOutputPath?: string;
  triggerOutputPath?: string;
  region: string;
  project: { [name: string]: ProjectConfiguration };
}

export interface ProjectConfiguration {
  domain?: string;
  dynamicLinkDomain?: string;
  androidPackageName: string;
}

export type Collection = {
  fields: { [name: string]: Field };
  ownerField?: string;
  keyFields?: string[];
} & { [key in RuleType]?: Rule };

export enum FieldTypes {
  INT = "int",
  FLOAT = "float",
  STRING = "string",
  PATH = "path",
  DATETIME = "timestamp",
  MAP = "map",
}

export enum RuleType {
  GET = "rule:get",
  LIST = "rule:list",
  CREATE = "rule:create",
  UPDATE = "rule:update",
  DELETE = "rule:delete",
}

export enum Rule {
  ALL = "all",
  OWNER = "owner",
  AUTHENTICATED = "authenticated",
  NONE = "none",
}

export type SpecialField = "serverTimestamp";

export type Field = (FieldType & (Computed | NonComputed)) | SpecialField;

export type FieldType =
  | StringField
  | FloatField
  | ReferenceField
  | IntField
  | DatetimeField
  | SumField
  | CountField
  | DynamicLinkField
  // eslint-disable-next-line @typescript-eslint/ban-types
  | {};

export interface DynamicLinkField {
  type: "dynamicLink";
  title?: DynamicLinkAttribute;
  description?: DynamicLinkAttribute;
  imageURL?: DynamicLinkAttribute;
  isSuffixShort?: boolean;
}

export type DynamicLinkAttribute = string | DynamicLinkAttributeFromField;
export type DynamicLinkAttributeFromField = { field: string };

export interface Computed {
  isComputed?: boolean;
}

export interface NonComputed {
  isUnique?: boolean;
  isOptional?: boolean;
  isCreatable?: boolean;
  isUpdatable?: boolean;
}

export interface SumField {
  type: "sum";
  collection: string;
  field: string;
  reference: string;
}

export interface CountField {
  type: "count";
  collection: string;
  reference: string;
}

export interface StringField {
  type: "string";
  minLength?: number;
  maxLength?: number;
}

export interface DatetimeField {
  type: "timestamp";
}

export interface ReferenceField {
  type: "path";
  collection: string;
  syncFields?: string[];
}

export interface IntField {
  type: "int";
  min?: number;
  max?: number;
  deleteDocWhen?: number;
}

export interface FloatField {
  type: "float";
  min?: number;
  max?: number;
  deleteDocWhen?: number;
}

export interface FlamestoreModule {
  validateRaw?: (rawSchema: unknown) => void;
  validate?: (schema: FlamestoreSchema) => void;
  ruleFunction?: (
    collectionName: string,
    collection: Collection,
    schema: FlamestoreSchema
  ) => string[];
  getRule?: (
    fieldName: string,
    field: Field,
    collectionName: string,
    collection: Collection,
    schema: FlamestoreSchema
  ) => string[];
  triggerGenerator?: TriggerGenerator;
  isCreatable?: (field: Field) => boolean;
  isUpdatable?: (field: Field) => boolean;
  isCreatableOverride?: (field: Field) => boolean | undefined;
  isUpdatableOverride?: (
    fieldName: string,
    field: Field,
    collectionName: string,
    collection: Collection,
    schema: FlamestoreSchema
  ) => boolean | undefined;
  isPrimitive?: (field: Field) => boolean;
  isObject?: (field: Field) => boolean;
  preprocessSchema?: (schema: FlamestoreSchema) => FlamestoreSchema;
}

export type TriggerGenerator = (
  triggerMap: TriggerMap,
  collectionName: string,
  collection: Collection,
  fieldName: string,
  field: Field,
  schema: FlamestoreSchema
) => TriggerMap;

export interface TriggerMap {
  [collectionName: string]: CollectionTriggerMap;
}

export class CollectionTriggerMap {
  createTrigger: TriggerData;
  updateTrigger: TriggerData;
  deleteTrigger: TriggerData;

  constructor() {
    this.createTrigger = new TriggerData();
    this.updateTrigger = new TriggerData();
    this.deleteTrigger = new TriggerData();
  }
}

export class TriggerData {
  _header: string[] = [];
  dependencyPromises: {
    [dependencyName: string]: { collection: string; promise: string };
  } = {};
  _resultPromises: string[] = [];
  _data: UpdateData = {};
  _nonUpdateData: UpdateData = {};
  _content: string[] = [];

  addData(
    dataName: string,
    fieldName: string,
    fieldValue: string,
    fieldCondition?: string
  ): void {
    if (!Object.keys(this._data).includes(dataName)) {
      this._data[dataName] = {};
    }
    this._data[dataName][fieldName] = { fieldValue, fieldCondition };
  }
  addNonUpdateData(
    dataName: string,
    fieldName: string,
    fieldValue: string,
    fieldCondition?: string
  ): void {
    if (!Object.keys(this._nonUpdateData).includes(dataName)) {
      this._nonUpdateData[dataName] = {};
    }
    this._nonUpdateData[dataName][fieldName] = { fieldValue, fieldCondition };
  }
  addHeader(content: string): void {
    if (!this._header.join("").includes(content)) {
      this._header.push(content);
    }
  }
  addContent(content: string): void {
    if (!this._content.join("").includes(content)) {
      this._content.push(content);
    }
  }
  addResultPromise(content: string): void {
    if (!this._resultPromises.join("").includes(content)) {
      this._resultPromises.push(content);
    }
  }
  isEmpty(): boolean {
    return (
      this._header.length === 0 &&
      Object.keys(this.dependencyPromises).length === 0 &&
      this._resultPromises.join("") === "" &&
      Object.keys(this._data).length === 0 &&
      Object.keys(this._nonUpdateData).length === 0
    );
  }
}

interface UpdateData {
  [dataName: string]: UpdateFieldData;
}

export interface UpdateFieldData {
  [fieldName: string]: { fieldValue: string; fieldCondition?: string };
}
