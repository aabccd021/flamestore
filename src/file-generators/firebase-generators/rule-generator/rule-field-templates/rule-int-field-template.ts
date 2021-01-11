import _ from "lodash";
import { IntField } from "../../../generator-types";
import { t } from "../../../generator-utils";

export function getIntValStr(field: IntField, fName: string): string[] {
  const { max, min, deleteDocWhen } = field;
  const vals = [];
  // TODO: <= first, then >=
  if (!_.isNil(min)) vals.push(t`${fName} >= ${min}`);
  if (!_.isNil(max)) vals.push(t`${fName} <= ${max}`);
  if (!_.isNil(deleteDocWhen)) vals.push(t`${fName} != ${deleteDocWhen}`);
  return vals;
}
