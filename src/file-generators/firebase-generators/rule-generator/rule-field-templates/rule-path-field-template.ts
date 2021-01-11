import { PathField } from "../../../generator-types";
import { t } from "../../../generator-utils";

export function getPathValStr(field: PathField, fName: string): string[] {
  const { isKeyField } = field;
  const vals = [
    t`${fName}.keys() == ['reference']`,
    t`${fName}.reference is path`,
    t`exists(${fName}.reference)`,
  ];
  if (isKeyField) {
    vals.push(t`get(${fName}.reference).id == ${fName}OfDocumentId()`);
  }
  return vals;
}
