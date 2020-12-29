import { FlamestoreModule } from "../../type";
import { isFieldNotCreatable, isFieldNotUpdatable } from "../../utils";

export const module: FlamestoreModule = {
  isNotCreatable: ({ field }) => isFieldNotCreatable(field),
  isNotUpdatable: ({ field }) => isFieldNotUpdatable(field),
};
