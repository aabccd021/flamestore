import { firestore } from "firebase-admin";
import { Change, EventContext } from "firebase-functions";
import { QueryDocumentSnapshot } from "firebase-functions/lib/providers/firestore";
import * as _functions from "firebase-functions";

export const functions = _functions.region("asia-southeast2");

export const serverTimestamp = firestore.FieldValue.serverTimestamp;
export const increment = firestore.FieldValue.increment;
export const foundDuplicate = async (
  collectionName: string,
  fieldName: string,
  snapshotOrChange: QueryDocumentSnapshot | Change<QueryDocumentSnapshot>,
  context: EventContext
): Promise<boolean> => {
  function isSnapshot(
    value: QueryDocumentSnapshot | Change<QueryDocumentSnapshot>
  ): value is QueryDocumentSnapshot {
    return !value.hasOwnProperty("after");
  }
  const snapshot = isSnapshot(snapshotOrChange)
    ? snapshotOrChange
    : snapshotOrChange.after;
  const duplicates = await firestore()
    .collection(collectionName)
    .where(fieldName, "==", snapshot.data()[fieldName])
    .get();
  if (duplicates.docs.length > 1) {
    _functions.logger.warn(
      `Duplicate ${fieldName} created on ${collectionName}`,
      { snapshot, context }
    );
    if (isSnapshot(snapshotOrChange)) {
      await snapshotOrChange.ref.delete();
    } else {
      await snapshotOrChange.before.ref.update({
        [fieldName]: snapshotOrChange.before.data()[fieldName],
      });
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
  _functions.logger.log(`Update ${ref.id}`, { data: data });
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
    querySnapshot.docs.map((doc) =>
      doc.ref
        .update(data)
        .then((_) => "")
        .catch((__) => `${doc.ref.id}`)
    )
  );
  const filteredResult = results.filter((result) => result !== "");
  _functions.logger.log(
    `Update where ${collection}.${refField}.id == ${ref.id} success on ${
      results.length - filteredResult.length
    } documents`,
    { updateData: data }
  );
  if (filteredResult.length > 0) {
    _functions.logger.warn(
      `Update where ${collection}.${refField}== ${ref.id} fail on ${filteredResult.length} documents`,
      { documentIds: filteredResult }
    );
  }
};
export abstract class Computed {
  abstract collection: string;
  abstract toMap(): { [fieldName: string]: any };
  abstract document: any;
  abstract isDependencyChanged(before: any, after: any, keys: any[]): boolean;
}

type onCreateFn<T, V> = (document: T, context: EventContext) => V;
type onUpdateFn<T, V> = (before: T, after: T, context: EventContext) => V;
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return obj as Pick<T, K>;
}

export class ComputeDocument<
  V extends Computed,
  K extends keyof T,
  T = V["document"]
> {
  computedDocument: V;
  computeOnCreate: onCreateFn<Pick<T, K>, V>;
  dependenciesOnUpdate: K[];
  computeOnUpdate: onUpdateFn<Pick<T, K>, V>;

  constructor({
    computedDocument,
    computeOnCreate,
    dependenciesOnUpdate,
    computeOnUpdate,
  }: {
    computedDocument: new () => V;
    computeOnCreate: onCreateFn<Pick<T, K>, V>;
    dependenciesOnUpdate: K[];
    computeOnUpdate: onUpdateFn<Pick<T, K>, V>;
  }) {
    this.computedDocument = new computedDocument();
    this.computeOnCreate = computeOnCreate;
    this.dependenciesOnUpdate = dependenciesOnUpdate;
    this.computeOnUpdate = computeOnUpdate;
  }

  private get document() {
    return functions.firestore.document(
      `/${this.computedDocument.collection}/{documentId}`
    );
  }

  public get onCreate() {
    return this.document.onCreate(async (snapshot, context) => {
      const newDoc = snapshot.data() as T;
      const result = this.computeOnCreate(newDoc, context).toMap();
      await snapshot.ref.update(result);
    });
  }

  public get onUpdate() {
    return this.document.onUpdate(async (change, context) => {
      const before = change.before.data() as T;
      const after = change.after.data() as T;
      const pickedBefore = pick(before, this.dependenciesOnUpdate);
      const pickedAfter = pick(after, this.dependenciesOnUpdate);
      if (
        !this.computedDocument.isDependencyChanged(
          before,
          after,
          this.dependenciesOnUpdate
        )
      ) {
        return;
      }
      const result = this.computeOnUpdate(
        pickedBefore,
        pickedAfter,
        context
      ).toMap();
      if (Object.keys(result).length === 0) {
        return;
      }
      await change.after.ref.update(result);
    });
  }
}
