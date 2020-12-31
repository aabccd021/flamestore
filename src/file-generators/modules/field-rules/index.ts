import { FlamestoreModule } from "../../type";
import {
  isNotCreatableSchemaField,
  isNotUpdatableSchemaField,
} from "../../generator-utils";

export const module: FlamestoreModule = {
  isNotCreatable: ({ field }) => isNotCreatableSchemaField(field),
  isNotUpdatable: ({ field }) => isNotUpdatableSchemaField(field),
};
