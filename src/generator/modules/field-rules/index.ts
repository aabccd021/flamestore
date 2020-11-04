import { FlamestoreModule, Field } from "../../type";

export const module: FlamestoreModule = {
  isCreatable: (field: Field) => field?.rules?.isCreatable == null || field.rules.isCreatable === true,
  isUpdatable: (field: Field) => field?.rules?.isUpdatable == null || field.rules.isUpdatable === true,
}