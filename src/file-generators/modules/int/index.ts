import _ from "lodash";
import { FlamestoreModule } from "../../type";
import { isTypeInt } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: ({ field }) => isTypeInt(field),
  isUpdatable: ({ field }) => isTypeInt(field),
  getRule({ fName, field }) {
    const content = [];
    if (isTypeInt(field)) {
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
