import { FlamestoreModule } from "../../module";
import { Collection, Field } from "../../schema";

export const module: FlamestoreModule = {
  ruleFunction,
  rule,
}

function ruleFunction(collection: Collection): string[] {
  return Object.entries(collection.fields)
    .filter(([_, field]) => field.isKey)
    .map(([fieldName, _], counter) => `function ${fieldName}OfDocumentId(){
        return documentId.split('_')[${counter}];
      }`);
}

function rule(fieldName: string, field: Field): string[] {
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