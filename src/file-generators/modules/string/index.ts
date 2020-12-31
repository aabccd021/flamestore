import _ from "lodash";
import { FlamestoreModule } from "../../type";
import { isStringSchemaField } from "../../generator-utils";

export const module: FlamestoreModule = {
  isCreatable: ({ field }) => isStringSchemaField(field),
  isUpdatable: ({ field }) => isStringSchemaField(field),
  getRule({ field, fName, col }) {
    const content = [];
    const fieldType = field;
    if (isStringSchemaField(fieldType)) {
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
