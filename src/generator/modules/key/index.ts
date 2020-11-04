import { FlamestoreModule, Field } from "../../type";

export const module: FlamestoreModule = {
  isUpdatable: (field: Field) => field.isKey == null,
}