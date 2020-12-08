import { FlamestoreModule, FlamestoreSchema } from "../type";

export function preprocessSchema(
  unprocessed: FlamestoreSchema,
  modules: FlamestoreModule[],
): FlamestoreSchema {
  let schema = unprocessed;
  modules.forEach(module => schema = module.preprocessSchema ? module.preprocessSchema(schema) : schema);
  // sort collection and fields
  // const collections = schema.collections;
  // const newCollections: { [name: string]: Collection } = {};
  // Object.keys(schema.collections).sort()
  //   .forEach(collectionName => newCollections[collectionName] = collections[collectionName]);
  // schema.collections = newCollections;
  // Object.entries(schema.collections).forEach(([collectionName, collection]) => {
  //   const fields = collection.fields;
  //   const newFields: { [name: string]: Field } = {};
  //   Object.keys(fields).sort().forEach(fieldName => {
  //     newFields[fieldName] = fields[fieldName];
  //   });
  //   schema.collections[collectionName].fields = newFields;
  // });
  return schema;
}