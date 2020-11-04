import { Collection, Field, FlamestoreModule } from "../../type";

export const module: FlamestoreModule = {
  ruleFunction,
  getRule,
}

function ruleFunction(collection: Collection): string[] {
  return Object.entries(collection.fields)
    .filter(([_, field]) => field.isKey)
    .map(([fieldName, _], counter) =>
      `      function ${fieldName}OfDocumentId(){
        return documentId.split('_')[${counter}];
      }`);
}

function getRule(fieldName: string, field: Field): string[] {
  if (field.isKey) {
    if (field?.type?.string) {
      return [`${fieldName} == ${fieldName}OfDocumentId()`];
    }
    if (field?.type?.path) {
      return [`get(${fieldName}).id == ${fieldName}OfDocumentId()`];
    }
  }
  return []
}