import { FlamestoreModule, Field } from "../../type";
import { isCreatable, isUpdatable } from "../../util";

export const module: FlamestoreModule = {
  isCreatableOverride: (field: Field) => {
    return isCreatable(field);
  },
  isUpdatableOverride: (field: Field) => isUpdatable(field),
}