import { FlamestoreModule } from "../../type";
import { isFieldNotCreatable, isFieldNotUpdatable } from "../../util";

export const module: FlamestoreModule = {
  isNotCreatable: isFieldNotCreatable,
  isNotUpdatable: isFieldNotUpdatable,
};
