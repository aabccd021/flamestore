import _ from "lodash";
import { FlameSchema } from "./schema-types";
import { CollectionEntry } from "../generator-types";
import { processSchemaCollection } from "./schema-preprocess-utils/schema-collection-utils";
import { preprocessAuth } from "./schema-preprocess-utils/schema-auth-utils";

export function processSchema(schema: FlameSchema): CollectionEntry[] {
  let schemaColMap = schema.collections;
  const preprocessFns = [preprocessAuth];
  preprocessFns.forEach((preprocessFn) => {
    schemaColMap = preprocessFn(schema, schemaColMap);
  });
  const colEntries = _(schema.collections)
    .map((schemaCol, colName) => {
      const col = processSchemaCollection(schemaCol, schemaColMap);
      return { colName, col };
    })
    .value();
  return colEntries;
}
