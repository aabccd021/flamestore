import _ from "lodash";
import { FlamestoreModule } from "../../type";
import { isTypeFloat } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: ({ field }) => isTypeFloat(field),
  isUpdatable: ({ field }) => isTypeFloat(field),
  getRule({ fName, field }) {
    const content = [];
    if (isTypeFloat(field)) {
      content.push(`${fName} is float`);
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
