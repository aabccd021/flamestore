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
