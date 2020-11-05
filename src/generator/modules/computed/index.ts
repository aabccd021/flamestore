import { FlamestoreModule, Field } from "../../type";

export const module: FlamestoreModule = {
  isCreatable: (field: Field) => !field?.isComputed,
  isUpdatable: (field: Field) => !field?.isComputed
}