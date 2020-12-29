import {
  Field,
  ImageField,
  ReferenceField,
  PrimitiveFieldTypes,
  FieldIteration,
  FlamestoreSchema as Schema,
  ImageMetadata,
} from "../../type";
import {
  isTypeImage,
  isTypeReference,
  isTypeSum,
  isTypeCount,
  isTypeDynamicLink,
  isTypeString,
  isTypeDatetime,
  isTypeInt,
  isTypeFloat,
  assertNever,
  getSyncFields,
  getImageMetadatas,
} from "../util";

export function typeOf(fIter: FieldIteration): string {
  const { field, schema } = fIter;
  if (isTypeImage(field)) return typeOfImage(field);
  if (isTypeReference(field)) return typeOfReference(field, schema);
  return typeOfPrim(field);
}

function typeOfImage(field: ImageField): string {
  return `{
    url?: string;
    ${getImageMetadatas(field).map(typeOfImageMetadata).join("\n")}
  }`;
}

function typeOfImageMetadata(data: ImageMetadata): string {
  return `${data}?:number;`;
}

function typeOfReference(field: ReferenceField, schema: Schema): string {
  return `{
    reference: firestore.DocumentReference;
    ${getSyncFields(field, schema).map(typeOfSyncedField).join("\n")}
  }`;
}

function typeOfSyncedField(fIter: FieldIteration): string {
  const { fName } = fIter;
  return `${fName}?:${typeOf(fIter)};`;
}

function typeOfPrim(
  field: Exclude<Field, ImageField | ReferenceField>
): tsTypes {
  if (field === "serverTimestamp") return "firestore.Timestamp";
  if (isTypeSum(field)) return "number";
  if (isTypeCount(field)) return "number";
  if (isTypeDynamicLink(field)) return "string";
  if (isTypeString(field)) return "string";
  if (isTypeDatetime(field)) return "firestore.Timestamp";
  if (isTypeInt(field)) return "number";
  if (isTypeFloat(field)) return "number";
  return typeOfComputed(field.compute);
}

function typeOfComputed(compute: PrimitiveFieldTypes): tsTypes {
  if (compute === "float") return "number";
  if (compute === "int") return "number";
  if (compute === "path") return "firestore.DocumentReference";
  if (compute === "timestamp") return "firestore.Timestamp";
  if (compute === "string") return "string";
  assertNever(compute);
}
type tsTypes =
  | "firestore.Timestamp"
  | "number"
  | "firestore.DocumentReference"
  | "string";
