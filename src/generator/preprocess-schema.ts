import _ from "lodash";
import { FlamestoreSchema } from "../type";
import { FlamestoreModule } from "./type";

export function preprocessSchema(
  schema: FlamestoreSchema,
  modules: FlamestoreModule[]
): FlamestoreSchema {
  _(modules)
    .map((e) => e.preprocessSchema)
    .compact()
    .forEach((preprocess) => (schema = preprocess(schema)));
  return schema;
}
