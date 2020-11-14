import { FlamestoreModule, Field } from "../../type";
import { isComputed } from "../../util";

export const module: FlamestoreModule = {
  isCreatableOverride: (field: Field) => isComputed(field) !== undefined ? !isComputed(field) : undefined,
  isUpdatableOverride: (field: Field) => isComputed(field) !== undefined ? !isComputed(field) : undefined,
}