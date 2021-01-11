import _ from "lodash";
import { FloatField } from "../../../generator-types";
import { t } from "../../../generator-utils";

export function getFloatValStr(field: FloatField, fName: string): string[] {
  const { max, min, deleteDocWhen } = field;
  const vals = [];
  if (!_.isNil(max)) vals.push(t`${fName} <= ${max}`);
  if (!_.isNil(min)) vals.push(t`${fName} >= ${min}`);
  if (!_.isNil(deleteDocWhen)) vals.push(t`${fName} != ${deleteDocWhen}`);
  return vals;
}
