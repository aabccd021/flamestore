import { FlamestoreModule } from "../../type";
import { isFieldComputed } from "../../generator-utils";

export const module: FlamestoreModule = {
  isNotCreatable: ({ field }) => isFieldComputed(field),
  isNotUpdatable: ({ field }) => isFieldComputed(field),
};
