import _ from "lodash";
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
import { t } from "../../generator-utils";

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
    const deleteOnStr = field.deleteDocWhen
      ? t`, deleteOn:${field.deleteDocWhen}`
      : "";
    return t`FloatField(${docFieldStr}${deleteOnStr})`;
  }
  if (isIntField(field)) {
    const deleteOnStr = _.isNil(field.deleteDocWhen)
      ? ""
      : t`, deleteOn:${field.deleteDocWhen}`;
    return t`IntField(${docFieldStr}${deleteOnStr})`;
  }
  if (isDynamicLinkField(field)) {
    const titleStr = toDynamicLinkAttributeStr("title", field.title);
    const descStr = toDynamicLinkAttributeStr("description", field.description);
    const imgUrlStr = toDynamicLinkAttributeStr("imageURL", field.imageURL);
    const isSuffixShortStr = field.isSuffixShort ? "true" : "false";
    return t`DynamicLinkField(
      ${docFieldStr},${titleStr}${descStr}${imgUrlStr}
      isSuffixShort:${isSuffixShortStr},
      )`;
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
    if (!col.ownerField) throw Error();
    const userIdStr = getImageOwnerFieldStr(col.ownerField);
    return t`ImageField(
      doc?.${fName}?.url,
      file: doc._${fName},
      userId: doc.${userIdStr},
    )`;
  }
  return "1";
}

function getImageOwnerFieldStr(ownerField: {
  name: string;
  type: "string" | "reference";
}): string {
  const { name, type } = ownerField;
  if (type === "string") return name;
  if (type === "reference") return t`${name}.reference.id`;
  assertNever(type);
}

function toDynamicLinkAttributeStr(
  attrName: string,
  attr?: DynamicLinkAttribute
): string {
  if (!attr) return "";
  // TODO: double quotes to quotes
  const attrValueStr = attr.isLiteral
    ? t`"${attr.content}"`
    : t`doc.${attr.content}`;
  return t`${attrName}:${attrValueStr},`;
}
