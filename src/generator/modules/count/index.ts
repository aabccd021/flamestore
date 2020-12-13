import _ from "lodash";
import { FlamestoreSchema, FieldIteration } from "../../../type";
import { addTriggerData, FlamestoreModule, TriggerMap } from "../../type";
import {
  assertCollectionNameExists,
  assertFieldHasTypeOf,
  isTypeCount,
} from "../../util";

export const module: FlamestoreModule = {
  validate,
  triggerGenerator,
};

function validate(schema: FlamestoreSchema): void {
  _.entries(schema.collections).forEach(([colName, col]) =>
    _.entries(col.fields).forEach(([fieldName, field]) => {
      if (isTypeCount(field)) {
        const stackTrace = `collections.${colName}.${fieldName}.count`;
        assertCollectionNameExists(
          field.collection,
          schema,
          `${stackTrace}.collection`
        );
        assertFieldHasTypeOf(
          field.collection,
          field.reference,
          "path",
          schema,
          `${stackTrace}.reference`
        );
      }
    })
  );
}

function triggerGenerator(
  triggerMap: TriggerMap,
  { field, fName, colName }: FieldIteration
): TriggerMap {
  if (isTypeCount(field)) {
    const targetRef = field.reference;
    triggerMap[colName].createTrigger = addTriggerData(
      triggerMap[colName].createTrigger,
      "snapshotRef",
      fName,
      "0"
    );
    triggerMap[field.collection].createTrigger = addTriggerData(
      triggerMap[field.collection].createTrigger,
      targetRef,
      fName,
      "increment(1)"
    );
    triggerMap[field.collection].deleteTrigger = addTriggerData(
      triggerMap[field.collection].deleteTrigger,
      targetRef,
      fName,
      "increment(-1)"
    );
  }
  return triggerMap;
}
