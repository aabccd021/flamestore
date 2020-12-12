import {
  FlamestoreModule,
  Collection,
  FlamestoreSchema,
  Field,
} from "../../../type";

export const module: FlamestoreModule = {
  isUpdatableOverride: (
    fieldName: string,
    _: Field,
    collectionName: string,
    collection: Collection,
    schema: FlamestoreSchema
  ) => {
    if (
      (schema.authentication?.userCollection === collectionName &&
        schema.authentication.uidField === fieldName) ||
      collection.keyFields?.includes(fieldName)
    ) {
      return false;
    }
    return undefined;
  },
  ruleFunction,
  getRule,
};

function ruleFunction(
  collectionName: string,
  collection: Collection,
  schema: FlamestoreSchema
): string[] {
  const keyFields = collection.keyFields ?? [];
  if (schema.authentication?.userCollection === collectionName) {
    keyFields.push(schema.authentication.uidField);
  }
  return Object.values(keyFields).map(
    (fieldName, counter) =>
      `      function ${fieldName}OfDocumentId(){
        return documentId.split('_')[${counter}];
      }`
  );
}

function getRule(
  fieldName: string,
  field: Field,
  collectionName: string,
  collection: Collection,
  schema: FlamestoreSchema
): string[] {
  const rules: string[] = [];
  if (collection.keyFields?.includes(fieldName) ?? false) {
    rules.push(`get(${fieldName}.reference).id == ${fieldName}OfDocumentId()`);
  }
  if (
    schema.authentication?.userCollection === collectionName &&
    schema.authentication.uidField === fieldName
  ) {
    rules.push(`${fieldName} == ${fieldName}OfDocumentId()`);
  }
  return rules;
}
