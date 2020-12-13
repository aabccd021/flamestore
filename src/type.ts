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

export type FieldTypes =
  | "int"
  | "float"
  | "string"
  | "path"
  | "timestamp"
  | "map";

export type RuleType =
  | "rule:get"
  | "rule:list"
  | "rule:create"
  | "rule:update"
  | "rule:delete";

export type Rule = "all" | "owner" | "authenticated" | "none";

export type SpecialField = "serverTimestamp";

// eslint-disable-next-line @typescript-eslint/ban-types
export type Field = (FieldType & FieldProperty) | SpecialField | {};

export interface FieldProperty {
  property?: NonComputed[] | NonComputed | Computed;
}

export type FieldType =
  | StringField
  | FloatField
  | ReferenceField
  | IntField
  | DatetimeField
  | SumField
  | CountField
  | DynamicLinkField;

export interface DynamicLinkField {
  type: "dynamicLink";
  title?: DynamicLinkAttribute;
  description?: DynamicLinkAttribute;
  imageURL?: DynamicLinkAttribute;
  isSuffixShort?: boolean;
}

export type DynamicLinkAttribute = string | DynamicLinkAttributeFromField;
export type DynamicLinkAttributeFromField = { field: string };

export type Computed = "isComputed";

export type NonComputed =
  | "isUnique"
  | "isOptional"
  | "isNotCreatable"
  | "isNotUpdatable";

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
  syncField?: string[] | string;
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

export interface CollectionIteration {
  colName: string;
  col: Collection;
  schema: FlamestoreSchema;
}

export interface FieldIteration extends CollectionIteration {
  fName: string;
  field: Field;
}
