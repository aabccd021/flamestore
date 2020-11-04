
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
  [name: string]: CollectionContent;
}

export interface CollectionContent {
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
  [name: string]: FieldContent;
}

export interface FieldContent {
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
