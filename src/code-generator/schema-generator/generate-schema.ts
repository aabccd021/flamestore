import { Schema, CollectionContent } from "../../utils/interface";
import { schemaImports, getAttribute, collectionSchema } from "./schema-template";

export function getSchemaContent(schema: Schema): string {
  let content = '';
  content += schemaImports;
  content += Object.entries(schema.collections).map(([colName, col]) => getCollectionSchema(colName, col, schema)).join('\n')
  return content;
}

function getCollectionSchema(collectionName: string, collection: CollectionContent, schema: Schema): string {
  const fieldEntries = Object.entries(collection.fields);
  return collectionSchema(
    collectionName,
    fieldEntries.map(([name, field]) => getAttribute(name, field, collectionName, schema)).join('\n'),
  );
}