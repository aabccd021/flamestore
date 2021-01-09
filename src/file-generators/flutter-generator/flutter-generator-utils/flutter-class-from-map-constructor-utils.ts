import { FieldEntry } from "../../generator-types";

export function toFromMapConstrAssgStr(fEntry: FieldEntry): string | null {
  return "";
  // if (isComputedField(field)) return null;
  // if (isCountField(field)) return t`${fName} = 0`;
  // if (isDynamicLinkField(field)) return null;
  // if (isFloatField(field)) return null;
  // if (isImageField(field)) return null;
  // if (isIntField(field)) return null;
  // if (isPathField(field)) return null;
  // if (isServerTimestampField(field)) return null;
  // if (isStringField(field)) return null;
  // if (isSumField(field)) return null;
  // assertNever(field);
}
