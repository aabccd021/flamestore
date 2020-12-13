import { firestore as defaultFirestore } from "firebase-admin";
import {
  logger,
  Change,
  EventContext,
  FunctionBuilder,
} from "firebase-functions";
import _ from "lodash";
import { QueryDocumentSnapshot } from "firebase-functions/lib/providers/firestore";
export { ProjectConfiguration } from "./type";

export function useFlamestoreUtils(
  firestore: typeof defaultFirestore,
  functions: FunctionBuilder
) {
  const _firestore = firestore();
  const serverTimestamp = firestore.FieldValue.serverTimestamp;
  const increment = firestore.FieldValue.increment;
  async function allSettled(promises: Promise<unknown>[]): Promise<unknown> {
    return Promise.all(promises.map((p) => p.catch(() => null)));
  }
  async function update(
    ref: defaultFirestore.DocumentReference,
    rawData: { [fieldName: string]: unknown }
  ): Promise<void> {
    const data = deepOmitNil(rawData);
    if (data) {
      logger.log(`Update ${ref.id}`, { omittedData: data });
      await ref.set(data, { merge: true });
    }
  }
  function hasDependencyChanged<T>(before: T, after: T): boolean {
    for (const key in before) {
      if (!isFieldEqual(before[key], after[key])) {
        return true;
      }
    }
    return false;
  }

  function isFieldEqual<T>(before: T, after: T): boolean {
    if (
      before instanceof firestore.Timestamp &&
      after instanceof firestore.Timestamp
    ) {
      return before.isEqual(after);
    }
    if (
      before instanceof firestore.DocumentReference &&
      after instanceof firestore.DocumentReference
    ) {
      return before.isEqual(after);
    }
    if (isReference(before) && isReference(after)) {
      for (const key in before) {
        if (isFieldEqual(before[key], after[key])) {
          return true;
        }
      }
      return false;
    }
    if (!before && !after) {
      return false;
    }
    return before === after;
  }

  function isReference(field: unknown): boolean {
    return Object.prototype.hasOwnProperty.call(field, "reference");
  }

  async function foundDuplicate(
    collectionName: string,
    fieldName: string,
    snapshotOrChange: QueryDocumentSnapshot | Change<QueryDocumentSnapshot>,
    context: EventContext
  ): Promise<boolean> {
    const snapshot = isSnapshot(snapshotOrChange)
      ? snapshotOrChange
      : snapshotOrChange.after;
    const duplicates = await _firestore
      .collection(collectionName)
      .where(fieldName, "==", snapshot.data()[fieldName])
      .get();
    if (duplicates?.docs?.length) {
      return false;
    }
    logger.warn(`Duplicate ${fieldName} created on ${collectionName}`, {
      snapshot,
      context,
    });
    if (isSnapshot(snapshotOrChange)) {
      await snapshotOrChange.ref.delete();
    } else {
      await snapshotOrChange.before.ref.set(
        {
          [fieldName]: snapshotOrChange.before.data()[fieldName],
        },
        { merge: true }
      );
    }
    return true;
  }

  async function syncField(
    collection: string,
    referenceField: string,
    reference: defaultFirestore.DocumentReference,
    rawData: { [fieldName: string]: unknown }
  ) {
    const data = deepOmitNil(rawData);
    if (!data) {
      return;
    }
    const querySnapshot = await _firestore
      .collection(collection)
      .where(`${referenceField}.reference`, "==", reference)
      .get();
    const results = await Promise.all(
      querySnapshot.docs.map((doc) =>
        doc.ref
          .set(data, { merge: true })
          .then(() => "")
          .catch(() => `${doc.ref.id}`)
      )
    );
    const filteredResult = results.filter((result) => result !== "");
    logger.log(
      `Update where ${collection}.${referenceField}.reference.id == ${
        reference.id
      } success on ${results.length - filteredResult.length} documents`,
      { updateData: data }
    );
    if (filteredResult.length > 0) {
      logger.warn(
        `Update where ${collection}.${referenceField}.reference.id ==` +
          ` ${reference.id} failed on ${filteredResult.length} documents`,
        { documentIds: filteredResult }
      );
    }
  }

  function computeDocument<
    // eslint-disable-next-line @typescript-eslint/ban-types
    T extends Object,
    C extends keyof T,
    D extends keyof Omit<T, C>
  >(
    collection: string,
    computedFields: readonly C[],
    dependencyFields: D[],
    onCreate: onCreateFn<T, C>,
    onUpdte: onUpdateFn<T, C, D>
  ) {
    const documentPath = functions.firestore.document(
      `/${collection}/{documentId}`
    );
    const doOnCreate = documentPath.onCreate(async (snapshot, context) => {
      const document = _.omit(snapshot.data() as T, computedFields);
      const result = deepOmitNil(onCreate({ document, context }));
      if (result) {
        await update(snapshot.ref, result);
      }
    });
    const doOnUpdate = documentPath.onUpdate(async (change, context) => {
      const before = _.omit(change.before.data() as T, computedFields);
      const after = _.omit(change.after.data() as T, computedFields);
      const dependencyBefore = _.pick(before, dependencyFields);
      const dependencyAfter = _.pick(after, dependencyFields);
      if (hasDependencyChanged(dependencyBefore, dependencyAfter)) {
        const result = deepOmitNil(onUpdte({ before, after, context }));
        if (result) {
          await update(change.after.ref, result);
        }
      }
    });
    return { onCreate: doOnCreate, onUpdate: doOnUpdate };
  }
  function deepOmitNil(obj: any) {
    _.forIn(obj, (value, key) => {
      obj[key] =
        _.isObject(value) && !(value instanceof firestore.FieldValue)
          ? deepOmitNil(value)
          : value;
    });
    const omitted = _.omitBy(obj, _.isNil);
    if (_.isEmpty(omitted)) {
      return null;
    }
    return omitted;
  }

  return {
    foundDuplicate,
    syncField,
    computeDocument,
    allSettled,
    update,
    serverTimestamp,
    increment,
  };
}

export type onCreateFn<T, C extends keyof T> = (snapshot: {
  document: Omit<T, C>;
  context: EventContext;
}) => Pick<T, C>;
export type onUpdateFn<
  T,
  C extends keyof T,
  D extends keyof Omit<T, C>
> = (snapshot: {
  before: Pick<Omit<T, C>, D>;
  after: Pick<Omit<T, C>, D>;
  context: EventContext;
}) => Pick<T, C>;
function isSnapshot(
  value: QueryDocumentSnapshot | Change<QueryDocumentSnapshot>
): value is QueryDocumentSnapshot {
  return !Object.prototype.hasOwnProperty.call(value, "after");
}
