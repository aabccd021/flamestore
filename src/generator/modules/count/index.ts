import {
  FlamestoreSchema,
  FieldTypes,
  Collection,
  Field,
  TriggerMap,
  FlamestoreModule,
} from "../../../type";
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
  Object.entries(schema.collections).forEach(([colName, col]) =>
    Object.entries(col.fields).forEach(([fieldName, field]) => {
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
          FieldTypes.PATH,
          schema,
          `${stackTrace}.reference`
        );
      }
    })
  );
}

function triggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  __: Collection,
  fieldName: string,
  field: Field
): TriggerMap {
  if (isTypeCount(field)) {
    const targetRef = field.reference;
    const colTriggerMap = triggerMap[field.collection];

    triggerMap[collectionName].createTrigger.addData(
      "snapshotRef",
      fieldName,
      "0"
    );

    colTriggerMap.createTrigger.addData(targetRef, fieldName, "increment(1)");

    colTriggerMap.deleteTrigger.addData(targetRef, fieldName, "increment(-1)");
  }
  return triggerMap;
}
