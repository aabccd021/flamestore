export interface FlamestoreSchema {
  $schema: string;
  authentication?: { userCollection: string; uidField: string };
  collections: { [name: string]: Collection };
  ruleOutputPath?: string;
  triggerOutputPath?: string;
  flutterOutputPath?: string;
  region: Region;
  project: { [name: string]: ProjectConfiguration };
}

type Region =
  | "us-central1"
  | "us-east1"
  | "us-east4"
  | "us-west2"
  | "us-west3"
  | "us-west4"
  | "europe-west1"
  | "europe-west2"
  | "europe-west3"
  | "europe-west6"
  | "asia-east2"
  | "asia-northeast1"
  | "asia-northeast2"
  | "asia-northeast3"
  | "asia-south1"
  | "asia-southeast2"
  | "northamerica-northeast1"
  | "southamerica-east1"
  | "australia-southeast1";

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

export type PrimitiveFieldTypes =
  | "int"
  | "float"
  | "string"
  | "timestamp"
  | "path";

export type NonPrimitiveFieldTypes = "sum" | "count" | "dynamicLink";

export type FieldTypes = PrimitiveFieldTypes | NonPrimitiveFieldTypes;

export type RuleType =
  | "rule:get"
  | "rule:list"
  | "rule:create"
  | "rule:update"
  | "rule:delete";

export type Rule = "all" | "owner" | "authenticated" | "none";

export type SpecialField = "serverTimestamp" | ComputedField;

export type Field = NormalField | SpecialField;

export interface ComputedField {
  compute: PrimitiveFieldTypes;
}

export interface FieldProperty {
  property?: ArrayOr<NonComputed>;
}

export type NormalField = FieldProperty & FieldType;

export type FieldType =
  | DynamicLinkField
  | StringField
  | FloatField
  | ReferenceField
  | IntField
  | DatetimeField
  | SumField
  | CountField
  | ImageField;

export interface DynamicLinkField {
  type: "dynamicLink";
  title?: DynamicLinkAttribute;
  description?: DynamicLinkAttribute;
  imageURL?: DynamicLinkAttribute;
  isSuffixShort?: boolean;
}

export type DynamicLinkAttribute = string | DynamicLinkAttributeFromField;
export type DynamicLinkAttributeFromField = { field: string };

export type NonComputed =
  | "isUnique"
  | "isOptional"
  | "isNotCreatable"
  | "isNotUpdatable";

export interface ImageField {
  type: "image";
  metadata?: ArrayOr<ImageMetadata>;
}

export type ImageMetadata = "height" | "width" | "size";

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
  syncField?: ArrayOr<string>;
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
  pascalColName: string;
  singularColName: string;
  colName: string;
  col: Collection;
  schema: FlamestoreSchema;
}

export interface FieldIteration extends CollectionIteration {
  pascalFName: string;
  fName: string;
  field: Field;
}

export type ArrayOr<T> = T | T[];
