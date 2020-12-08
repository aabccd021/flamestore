import { FlamestoreModule, ReferenceField } from "../../../type";

export const module: FlamestoreModule = {
  preprocessSchema: (schema) => {
    if (schema.authentication) {
      const auth = schema.authentication;
      schema.collections[auth.userCollection].fields[auth.uidField] = {
        string: {}
      };
      Object.entries(schema.collections)
        .forEach(([collectionName, collection]) => {
          if (collection.ownerField) {
            if (collection.fields[collection.ownerField]) {
              (schema.collections[collectionName].fields[collection.ownerField] as ReferenceField)
                .path.collection = auth.userCollection;
            } else {
              schema.collections[collectionName].fields[collection.ownerField] = {
                path: {
                  collection: auth.userCollection
                }
              };
            }
          }
        });
    }
    return schema;
  }
};
