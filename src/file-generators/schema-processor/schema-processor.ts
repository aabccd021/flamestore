import _ from "lodash";
import { FlameSchema } from "./schema-types";
import { CollectionEntry } from "../generator-types";
import { processSchemaCollection } from "./schema-preprocess-utils/schema-collection-utils";
import { preprocessAuth } from "./schema-preprocess-utils/schema-auth-utils";

export function processSchema(schema: FlameSchema): CollectionEntry[] {
  let schemaColMap = schema.collections;
  const preprocessFns = [preprocessAuth];
  preprocessFns.forEach((fn) => (schemaColMap = fn(schema, schemaColMap)));
  const colEntries = _(schema.collections).map((schemaCol, colName) => {
    const data = { schemaColMap, schemaCol, colName };
    const col = processSchemaCollection(data);
    return { colName, col };
  });
  return colEntries.value();
}
