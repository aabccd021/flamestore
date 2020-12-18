import _ from "lodash";
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
      if (!_.isNil(maxLength)) {
        content.push(`${fName}.size() <= ${maxLength}`);
      }
      const minLength = fieldType.minLength;
      if (!_.isNil(minLength)) {
        content.push(`${fName}.size() >= ${minLength}`);
      }
    }
    return content;
  },
};
