import { FlamestoreModule } from "../../type";
import { isFieldComputed } from "../../util";

export const module: FlamestoreModule = {
  isNotCreatable: ({ field }) => isFieldComputed(field),
  isNotUpdatable: ({ field }) => isFieldComputed(field),
};
