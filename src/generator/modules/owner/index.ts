import { Field, FlamestoreModule, FlamestoreSchema } from "../../../type";
import { isTypeReference, isTypeString } from "../../util";

export const module: FlamestoreModule = {
  validate,
};

function validate(schema: FlamestoreSchema) {
  validateIsOwnerDocRef(schema);
  validateIsOwnerUid(schema);
}


function validateIsOwnerDocRef(schema: FlamestoreSchema) {
  Object.entries(schema.collections).forEach(([collectionName, collection]) => {
    let colOwnerDocRef: Field | null = null;
    Object.entries(collection.fields).forEach(([fieldName, field]) => {
      const fieldType = field.type;
      if (isTypeReference(fieldType) && fieldType?.path?.isOwnerDocRef) {
        if (colOwnerDocRef) {
          throw Error(`Collection ${collectionName} needs to have only 1 owner doc ref.`);
        }
        colOwnerDocRef = field;
        const stackTrace = `collections.${collectionName}.${fieldName}.type.path.isOwnerDocRef`;
        const userCollectionName = fieldType.path.collection;
        const userCollection = schema.collections[userCollectionName];
        let hasOwnerUidString = false;
        Object.values(userCollection.fields).forEach((userColField) => {
          if (isTypeString(userColField.type) && userColField.type?.string?.isOwnerUid) {
            hasOwnerUidString = true;
          }
        });
        if (!hasOwnerUidString) {
          throw Error(`Collection ${userCollectionName} needs to have string field with '"isOwnerId": true' as required in ${stackTrace}.`);
        }
      }
    });
  });
}

function validateIsOwnerUid(schema: FlamestoreSchema) {
  Object.entries(schema.collections).forEach(([collectionName, collection]) => {
    let colOwnerUid: Field | null = null;
    Object.values(collection.fields).forEach(field => {
      if (isTypeString(field.type) && field.type?.string?.isOwnerUid) {
        if (colOwnerUid) {
          throw Error(`Collection ${collectionName} needs to have only 1 field with owner uid.`);
        }
        colOwnerUid = field;
      }
    });
  });
}