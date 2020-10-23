import { FlamestoreSchema } from './interface';

export function assertCollectionNameExists(collectionName: string, schema: FlamestoreSchema, stackTrace: string) {
  if (!Object.keys(schema.collections).includes(collectionName)) {
    throw Error(
      `Invalid Collection: ${stackTrace} provided collection with name ${collectionName} which doesn't exist`
    );
  };
}

