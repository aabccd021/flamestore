import { FlamestoreSchema, Collection } from "../../types/schema";
import { schemaImports, getAttribute, collectionSchema } from "./schema-template";

export function getSchemaContent(schema: FlamestoreSchema): string {
  let content = '';
  content += schemaImports;
  content += Object.entries(schema.collections).map(([colName, col]) => getCollectionSchema(colName, col, schema)).join('\n')
  return content;
}

function getCollectionSchema(collectionName: string, collection: Collection, schema: FlamestoreSchema): string {
  const fieldEntries = Object.entries(collection.fields);
  return collectionSchema(
    collectionName,
    fieldEntries.map(([name, field]) => getAttribute(name, field, collectionName, schema)).join('\n'),
  );
}