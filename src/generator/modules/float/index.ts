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
      if (min || min === 0) {
        content.push(`${fName} >= ${min}`);
      }
      const max = field.max;
      if (max || max === 0) {
        content.push(`${fName} <= ${field.max}`);
      }
      const deleteDocWhen = field.deleteDocWhen;
      if (deleteDocWhen || deleteDocWhen === 0) {
        content.push(`${fName} != ${deleteDocWhen}`);
      }
    }
    return content;
  },
};
