import _ from "lodash";
import { FlamestoreModule } from "../../type";
import { isIntSchemaField } from "../../generator-utils";

export const module: FlamestoreModule = {
  isCreatable: ({ field }) => isIntSchemaField(field),
  isUpdatable: ({ field }) => isIntSchemaField(field),
  getRule({ fName, field }) {
    const content = [];
    if (isIntSchemaField(field)) {
      content.push(`${fName} is int`);
      const min = field.min;
      if (!_.isNil(min)) {
        content.push(`${fName} >= ${min}`);
      }
      const max = field.max;
      if (!_.isNil(max)) {
        content.push(`${fName} <= ${field.max}`);
      }
      const deleteDocWhen = field.deleteDocWhen;
      if (!_.isNil(deleteDocWhen)) {
        content.push(`${fName} != ${deleteDocWhen}`);
      }
    }
    return content;
  },
};
