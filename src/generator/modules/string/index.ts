import { FlamestoreModule } from "../../type";
import { isTypeString } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: ({ field }) => isTypeString(field),
  isUpdatable: ({ field }) => isTypeString(field),
  getRule({ field, fName, col }) {
    const content = [];
    const fieldType = field;
    if (isTypeString(fieldType)) {
      content.push(`${fName} is string`);
      if (col.keyFields?.includes(fName) ?? false) {
        content.push(`${fName} == ${fName}OfDocumentId()`);
      }
      const maxLength = fieldType.maxLength;
      if (maxLength || maxLength === 0) {
        content.push(`${fName}.size() <= ${maxLength}`);
      }
      const minLength = fieldType.minLength;
      if (minLength || minLength === 0) {
        content.push(`${fName}.size() >= ${minLength}`);
      }
    }
    return content;
  },
};
