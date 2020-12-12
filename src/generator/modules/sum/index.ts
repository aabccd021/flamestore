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
  isTypeSum,
} from "../../util";

export const module: FlamestoreModule = {
  validate,
  triggerGenerator,
};

function validate(schema: FlamestoreSchema): void {
  for (const [collectionName, collection] of Object.entries(
    schema.collections
  )) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (isTypeSum(field)) {
        const stackTrace = `collections.${collectionName}.${fieldName}.sum`;
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
        assertFieldHasTypeOf(
          field.collection,
          field.field,
          FieldTypes.INT,
          schema,
          `${stackTrace}.field`
        );
      }
    }
  }
}

function triggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  __: Collection,
  fieldName: string,
  field: Field
): TriggerMap {
  if (isTypeSum(field)) {
    const targetRef = field.reference;
    const incrementField = field.field;

    triggerMap[collectionName].createTrigger.addData(
      "snapshotRef",
      fieldName,
      "0"
    );

    triggerMap[field.collection].createTrigger.addData(
      targetRef,
      fieldName,
      `increment(data.${incrementField})`
    );

    triggerMap[field.collection].updateTrigger.addData(
      targetRef,
      fieldName,
      `increment(after.${incrementField} - before.${incrementField})`,
      `after.${incrementField} !== before.${incrementField}`
    );

    triggerMap[field.collection].deleteTrigger.addData(
      targetRef,
      fieldName,
      `increment(-data.${incrementField})`
    );
  }
  return triggerMap;
}
