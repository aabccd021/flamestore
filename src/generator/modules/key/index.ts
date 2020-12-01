import { FlamestoreModule, Collection } from "../../../type";
import { isTypeReference, isTypeString } from "../../util";

export const module: FlamestoreModule = {
  ruleFunction,
}

function ruleFunction(collection: Collection): string[] {
  return Object.entries(collection.fields)
    .filter(([_, field]) => {
      const fieldType = field.type;
      if (isTypeString(fieldType)) {
        return fieldType.string.isKey;
      }
      if (isTypeReference(fieldType)) {
        return fieldType.path.isKey;
      }
      return false;
    })
    .map(([fieldName, _], counter) =>
      `      function ${fieldName}OfDocumentId(){
        return documentId.split('_')[${counter}];
      }`);
}