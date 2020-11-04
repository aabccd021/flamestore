import { firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';

export const increment = firestore.FieldValue.increment;
export const foundDuplicate = async (
  collectionName: string,
  fieldName: string,
  snapshotOrChange: functions.firestore.QueryDocumentSnapshot
    | functions.Change<functions.firestore.QueryDocumentSnapshot>,
  context: functions.EventContext,
): Promise<boolean> => {
  function isSnapshot(value: functions.firestore.QueryDocumentSnapshot
    | functions.Change<functions.firestore.QueryDocumentSnapshot>):
    value is functions.firestore.QueryDocumentSnapshot {
    return !value.hasOwnProperty('after');
  }
  const snapshot = isSnapshot(snapshotOrChange) ? snapshotOrChange : snapshotOrChange.after;
  const duplicates = await firestore()
    .collection(collectionName)
    .where(fieldName, "==", snapshot.data()[fieldName])
    .get();
  if (duplicates.docs.length > 1) {
    functions.logger.warn(
      `Duplicate ${fieldName} created on ${collectionName}`,
      { snapshot, context }
    );
    if (isSnapshot(snapshotOrChange)) {
      await snapshotOrChange.ref.delete();
    } else {
      await snapshotOrChange.before.ref.update({ [fieldName]: snapshotOrChange.before.data()[fieldName] })
    }
    return true;
  }
  return false;
};
export const allSettled = (promises: Promise<any>[]): Promise<any> => {
  return Promise.all(promises.map((p) => p.catch((_) => null)));
};
export const update = async (
  ref: firestore.DocumentReference,
  data: { [fieldName: string]: any }
) => {
  functions.logger.log(`Update ${ref.id}`, { data: data });
  if (Object.keys(data).length > 0) {
    await ref.update(data);
  }
};
export const syncField = async (
  collection: string,
  refField: string,
  ref: firestore.DocumentReference,
  data: { [fieldName: string]: any }
) => {
  if (Object.keys(data).length === 0) {
    return;
  }
  const querySnapshot = await firestore()
    .collection(collection)
    .where(refField, "==", ref)
    .get();
  const results = await Promise.all(
    querySnapshot.docs.map(
      (doc) => doc.ref
        .update(data)
        .then((_) => "")
        .catch((__) => `${doc.ref.id}`)
    )
  );
  const filteredResult = results.filter((result) => result !== "");
  functions.logger.log(
    `Update where ${collection}.${refField}.id == ${ref.id} success on ${results.length - filteredResult.length} documents`,
    { updateData: data }
  );
  if (filteredResult.length > 0) {
    functions.logger.warn(
      `Update where ${collection}.${refField}== ${ref.id} fail on ${filteredResult.length} documents`,
      { documentIds: filteredResult }
    );
  }
};