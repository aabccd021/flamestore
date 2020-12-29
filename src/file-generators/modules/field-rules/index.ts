import { FlamestoreModule } from "../../type";
import { isFieldNotCreatable, isFieldNotUpdatable } from "../../util";

export const module: FlamestoreModule = {
  isNotCreatable: ({ field }) => isFieldNotCreatable(field),
  isNotUpdatable: ({ field }) => isFieldNotUpdatable(field),
};
