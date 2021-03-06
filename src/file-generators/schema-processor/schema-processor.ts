import _ from "lodash";
import { FlameSchema } from "./schema-types";
import { CollectionEntry } from "../generator-types";
import { processSchemaCollection } from "./schema-preprocess-utils/schema-collection-utils";
import { preprocessAuth } from "./schema-preprocess-utils/schema-auth-utils";

export function processSchema(schema: FlameSchema): CollectionEntry[] {
  const { authentication } = schema;
  let schemaColMap = schema.collections;
  const preprocessFns = [preprocessAuth];
  preprocessFns.forEach((fn) => (schemaColMap = fn(schema, schemaColMap)));
  // TODO: sort col and field
  const colEntries = _(schema.collections).map((schemaCol, colName) => {
    const projects = schema.project;
    const data = { schemaColMap, schemaCol, colName, projects, authentication };
    const col = processSchemaCollection(data);
    return { colName, col };
  });
  return colEntries.value();
}
