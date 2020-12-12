import { FlamestoreModule, ReferenceField } from "../../../type";

export const module: FlamestoreModule = {
  preprocessSchema: (schema) => {
    if (schema.authentication) {
      const auth = schema.authentication;
      schema.collections[auth.userCollection].fields[auth.uidField] = {
        type: "string",
      };
      Object.entries(schema.collections).forEach(
        ([collectionName, collection]) => {
          if (collection.ownerField) {
            if (collection.fields[collection.ownerField]) {
              (schema.collections[collectionName].fields[
                collection.ownerField
              ] as ReferenceField).collection = auth.userCollection;
            } else {
              schema.collections[collectionName].fields[
                collection.ownerField
              ] = {
                type: "path",
                collection: auth.userCollection,
              };
            }
          }
        }
      );
    }
    return schema;
  },
};
