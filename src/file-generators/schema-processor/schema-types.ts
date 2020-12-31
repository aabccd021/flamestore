import { ArrayOr } from "../../types";
import { ComputedSchemaField } from "./schema-field-utils/schema-computed-utils";
import { CountSchemaField } from "./schema-field-utils/schema-count-utils";
import { DynamicLinkSchemaField } from "./schema-field-utils/schema-dynamic-link-utils";
import { FloatSchemaField } from "./schema-field-utils/schema-float-utils";
import { ImageSchemaField } from "./schema-field-utils/schema-image-utils";
import { SchemaIntField as IntSchemaField } from "./schema-field-utils/schema-int-utils";
import { PathSchemaField } from "./schema-field-utils/schema-path-utils";
import { ServerTimestampSchemaField } from "./schema-field-utils/schema-server-timestamp-utils";
import { StringSchemaField } from "./schema-field-utils/schema-string-utils";
import { SumSchemaField } from "./schema-field-utils/schema-sum-utils";

export type FlameSchema = FlameSchemaMetadata & {
  $schema: string;
  collections: { [name: string]: SchemaCollection };
};

export type FlameSchemaMetadata = {
  ruleOutputPath?: string;
  triggerOutputPath?: string;
  flutterOutputPath?: string;
  region: FirebaseRegion;
  project: { [name: string]: ProjectConfiguration };
  authentication?: FlameSchemaAuth;
};

export type FlameSchemaAuth = {
  userCollection: string;
  uidField: string;
};

export type FirebaseRegion =
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

export type ProjectConfiguration = {
  domain?: string;
  dynamicLinkDomain?: string;
  androidPackageName: string;
};

export type SchemaCollection = {
  fields: { [name: string]: SchemaField };
  ownerField?: string;
  keyFields?: string[];
} & { [key in RuleType]?: "all" | "owner" | "authenticated" | "none" };

export type RuleType =
  | "rule:get"
  | "rule:list"
  | "rule:create"
  | "rule:update"
  | "rule:delete";

export type SchemaField =
  | (NormalSchemaFieldMetadata & NormalSchemaField)
  | ComputedSchemaField
  | CountSchemaField
  | ServerTimestampSchemaField
  | SumSchemaField;

export type NormalSchemaField =
  | DynamicLinkSchemaField
  | FloatSchemaField
  | ImageSchemaField
  | IntSchemaField
  | PathSchemaField
  | StringSchemaField;

export type NormalSchemaFieldMetadata = {
  property?: ArrayOr<NormalSchemaFieldProperties>;
};

export type NormalSchemaFieldProperties =
  | "isUnique"
  | "isOptional"
  | "isNotCreatable"
  | "isNotUpdatable";
