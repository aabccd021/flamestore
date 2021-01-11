import { assertNever } from "../../../utils";
import {
  DynamicLinkAttribute,
  FieldCollectionEntry,
  isComputedField,
  isCountField,
  isDynamicLinkField,
  isFloatField,
  isImageField,
  isIntField,
  isPathField,
  isServerTimestampField,
  isStringField,
  isSumField,
} from "../../generator-types";
import { nilOr, t } from "../../generator-utils";

export function toDocToMapStr(fcEntry: FieldCollectionEntry): string {
  const { fName } = fcEntry;
  const valueStr = toDocToMapValueStr(fcEntry);
  return t`'${fName}': ${valueStr},`;
}

export function toDocToMapValueStr(fcEntry: FieldCollectionEntry): string {
  const { field, fName, col } = fcEntry;
  const docFieldStr = t`doc.${fName}`;
  if (isPathField(field)) return docFieldStr;
  if (isStringField(field)) return t`StringField(${docFieldStr})`;
  if (isSumField(field)) return t`SumField(${docFieldStr}?.toDouble())`;
  if (isCountField(field)) return t`CountField(${docFieldStr})`;
  if (isServerTimestampField(field)) {
    return t`TimestampField(${docFieldStr}, isServerTimestamp: true,)`;
  }
  if (isFloatField(field)) {
    const deleteOnStr = nilOr(field.deleteDocWhen, (x) => t`, deleteOn:${x}`);
    return t`FloatField(${docFieldStr}${deleteOnStr})`;
  }
  if (isIntField(field)) {
    const deleteOnStr = nilOr(field.deleteDocWhen, (x) => t`, deleteOn:${x}`);
    return t`IntField(${docFieldStr}${deleteOnStr})`;
  }
  if (isDynamicLinkField(field)) {
    const titleStr = toDynamicLinkAttributeStr("title", field.title);
    const descStr = toDynamicLinkAttributeStr("description", field.description);
    const imgUrlStr = toDynamicLinkAttributeStr("imageURL", field.imageURL);
    const isSuffixShortStr = field.isSuffixShort ? "true" : "false";
    return t`DynamicLinkField(
      ${docFieldStr},${titleStr}${descStr}${imgUrlStr}
      isSuffixShort:${isSuffixShortStr},)`;
  }
  if (isComputedField(field)) {
    const fieldType = field.computedFieldType;
    if (fieldType === "float") return t`FloatField(${docFieldStr})`;
    if (fieldType === "int") return t`IntField(${docFieldStr})`;
    if (fieldType === "timestamp") return t`TimestampField(${docFieldStr})`;
    if (fieldType === "string") return t`StringField(${docFieldStr})`;
    assertNever(fieldType);
  }
  if (isImageField(field)) {
    const userIdStr = getImageOwnerFieldStr(col);
    return t`ImageField(
      doc?.${fName}?.url,
      file: doc._${fName},
      userId: doc.${userIdStr},)`;
  }
  assertNever(field);
}

function getImageOwnerFieldStr(param: {
  ownerField?: string;
  isOwnerCol: boolean;
}): string {
  const { isOwnerCol, ownerField } = param;
  if (isOwnerCol) return "uid";
  if (ownerField) return t`${ownerField}.reference.id`;
  throw Error("Image needs owner");
}

function toDynamicLinkAttributeStr(
  attrName: string,
  attr?: DynamicLinkAttribute
): string {
  if (!attr) return "";
  const attrValueStr = attr.isLiteral
    ? t`'${attr.content}'`
    : t`doc.${attr.content}`;
  return t`${attrName}:${attrValueStr},`;
}
