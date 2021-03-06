export type FieldEntry = Readonly<{ fName: string; field: Field }>;

export type CollectionEntry = Readonly<{ colName: string; col: Collection }>;

export type FieldCollectionEntry = FieldEntry & CollectionEntry;

export type FieldProperty = Readonly<{
  isOptional: boolean;
  isUnique: boolean;
  isNotUpdatable: boolean;
}>;

export type Field =
  | ComputedField
  | CountField
  | DynamicLinkField
  | FloatField
  | ImageField
  | IntField
  | PathField
  | ServerTimestampField
  | StringField
  | SumField;

export type Collection = Readonly<{
  fields: _.Collection<FieldEntry>;
  ownerField?: string;
  isOwnerCol: boolean;
  keyFieldNames: string[];
}>;

export type ImageField = Readonly<
  FieldProperty & {
    type: "image";
    metadatas: ImageMetadata[];
  }
>;
export type ImageMetadata = "height" | "width" | "size";

export type SumField = Readonly<
  FieldProperty & {
    type: "sum";
    colName: string;
    incFieldName: string;
    refName: string;
  }
>;

export type CountField = Readonly<
  FieldProperty & {
    type: "count";
    colName: string;
    refName: string;
  }
>;

export type DynamicLinkField = Readonly<
  FieldProperty & {
    type: "dynamicLink";
    title?: DynamicLinkAttribute;
    description?: DynamicLinkAttribute;
    imageURL?: DynamicLinkAttribute;
    isSuffixShort: boolean;
    domains: string[];
  }
>;

export type DynamicLinkAttribute = Readonly<{
  isLiteral: boolean;
  content: string;
}>;

export type StringField = Readonly<
  FieldProperty & {
    type: "string";
    isKeyField: boolean;
    minLength?: number;
    maxLength?: number;
  }
>;

export type PathField = Readonly<
  FieldProperty & {
    type: "path";
    isKeyField: boolean;
    colName: string;
    syncFields: FieldEntry[];
  }
>;

export type IntField = Readonly<
  FieldProperty & {
    type: "int";
    min?: number;
    max?: number;
    deleteDocWhen?: number;
  }
>;

export type FloatField = Readonly<
  FieldProperty & {
    type: "float";
    min?: number;
    max?: number;
    deleteDocWhen?: number;
  }
>;

export type ComputedField = Readonly<
  FieldProperty & {
    type: "computed";
    computedFieldType: "int" | "float" | "string" | "timestamp";
  }
>;

export type ServerTimestampField = Readonly<
  FieldProperty & {
    type: "serverTimestamp";
  }
>;

export function isDynamicLinkField(field: Field): field is DynamicLinkField {
  return (field as DynamicLinkField).type === "dynamicLink";
}

export function isStringField(field: Field): field is StringField {
  return (field as StringField).type === "string";
}

export function isFloatField(field: Field): field is FloatField {
  return (field as FloatField).type === "float";
}

export function isPathField(field: Field): field is PathField {
  return (field as PathField).type === "path";
}

export function isIntField(field: Field): field is IntField {
  return (field as IntField).type === "int";
}

export function isSumField(field: Field): field is SumField {
  return (field as SumField).type === "sum";
}

export function isCountField(field: Field): field is CountField {
  return (field as CountField).type === "count";
}

export function isImageField(field: Field): field is ImageField {
  return (field as ImageField).type === "image";
}

export function isComputedField(field: Field): field is ComputedField {
  return (field as ComputedField).type === "computed";
}

export function isServerTimestampField(
  field: Field
): field is ServerTimestampField {
  return (field as ServerTimestampField).type === "serverTimestamp";
}
