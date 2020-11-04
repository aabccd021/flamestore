import { FlamestoreModule } from "../../module";
import { FlamestoreSchema } from "../../schema";

export const module: FlamestoreModule = {
  validate,
};

function validate(schema: FlamestoreSchema) {
  validateIsOwnerDocRef(schema);
  validateIsOwnerUid(schema);
}


function validateIsOwnerDocRef(schema: FlamestoreSchema) {
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    let colOwnerDocRef = null;
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (field.type?.path?.isOwnerDocRef) {
        if (colOwnerDocRef) {
          throw Error(`Collection ${collectionName} needs to have only 1 owner doc ref.`);
        }
        colOwnerDocRef = field;
        const stackTrace = `collections.${collectionName}.${fieldName}.type.path.isOwnerDocRef`;
        const userCollectionName = field.type.path.collection;
        const userCollection = schema.collections[userCollectionName];
        let hasOwnerUidString = false;
        for (const userColField of Object.values(userCollection.fields)) {
          if (userColField.type?.string?.isOwnerUid) {
            hasOwnerUidString = true;
          }
        }
        if (!hasOwnerUidString) {
          throw Error(`Collection ${userCollectionName} needs to have string field with '"isOwnerId": true' as required in ${stackTrace}.`);
        }
      }
    }
  }
}

function validateIsOwnerUid(schema: FlamestoreSchema) {
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    let colOwnerUid = null;
    for (const field of Object.values(collection.fields)) {
      if (field.type?.string?.isOwnerUid) {
        if (colOwnerUid) {
          throw Error(`Collection ${collectionName} needs to have only 1 field with owner uid.`);
        }
        colOwnerUid = field;
      }
    }
  }
}