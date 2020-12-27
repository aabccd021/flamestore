import _ from "lodash";
import { FieldIteration } from "../../../type";
import {
  isTypeReference,
  isTypeCount,
  isTypeImage,
  isTypeSum,
} from "../../util";
import { Trigger } from "../type";
import { countTriggerGenerator } from "./count";
import { imageTriggerGenerator } from "./image";
import { pathTriggerGenerator } from "./path";
import { sumTriggerGenerator } from "./sum";
import { timestampTriggerGenerator } from "./timestamp";
import { uniqueTriggerGenerator } from "./unique";

export function getTriggerMap(fIter: FieldIteration): Trigger[] {
  const { field } = fIter;
  return _.flatMap([
    uniqueTriggerGenerator(fIter),
    isTypeReference(field) ? pathTriggerGenerator(field, fIter) : [],
    isTypeCount(field) ? countTriggerGenerator({ field, fIter }) : [],
    isTypeImage(field) ? imageTriggerGenerator(field, fIter) : [],
    isTypeSum(field) ? sumTriggerGenerator(field, fIter) : [],
    field === "serverTimestamp" ? timestampTriggerGenerator(field, fIter) : [],
  ]);
}
