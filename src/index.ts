import {
  firestore as defaultFirestore,
  storage as defaultStorage,
} from "firebase-admin";
import {
  logger,
  Change,
  EventContext,
  FunctionBuilder,
} from "firebase-functions";
import _ from "lodash";
import { QueryDocumentSnapshot } from "firebase-functions/lib/providers/firestore";
import sharp from "sharp";
import path from "path";
export { ProjectConfiguration } from "./type";
import { ImageMetadata } from "./type";
import { assertNever } from "./file-generators/utils";

export function useFlamestoreUtils(
  firestore: typeof defaultFirestore,
  storage: typeof defaultStorage,
  functions: FunctionBuilder
) {
  const _firestore = firestore();
  const _storage = storage();
  const serverTimestamp = firestore.FieldValue.serverTimestamp;
  const increment = firestore.FieldValue.increment;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const projectId: string = JSON.parse(process.env.FIREBASE_CONFIG!).projectId;
  async function allSettled(promises: Promise<unknown>[]): Promise<unknown> {
    return Promise.all(promises.map((p) => p.catch(() => null)));
  }

  async function _imageDataOf(filePath: string, metadata: ImageMetadata[]) {
    // Get image file
    const imageFile = _storage.bucket().file(filePath);
    const [imageExists] = await imageFile.exists();
    if (!imageExists) return null;

    // Get file metadata
    const storageMetadata = await imageFile.getMetadata();
    const token: string =
      storageMetadata[0].metadata.firebaseStorageDownloadTokens;
    const size: number | undefined = storageMetadata[0].size;
    const encodedFilePath = encodeURIComponent(filePath);
    const url = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodedFilePath}?alt=media&token=${token}`;

    // Get image metadata
    const pipeline = sharp();
    imageFile.createReadStream().pipe(pipeline);
    const imageMetadata = await pipeline.metadata();
    const width = imageMetadata.width;
    const height = imageMetadata.height;
    const pickedMetadata = _.pick({ height, width, size }, metadata);

    //
    return { url, ...pickedMetadata };
  }

  async function imageDataOf(
    colName: string,
    fieldName: string,
    uid: string,
    metadata: ImageMetadata[],
    snapshot: QueryDocumentSnapshot
  ) {
    const docId = snapshot.id;
    const filePath = `${colName}/${fieldName}/raw/${uid}_${docId}.png`;
    return _imageDataOf(filePath, metadata);
  }

  function useOnImageUploaded(
    colName: string,
    fieldName: string,
    metadata: ImageMetadata[]
  ) {
    return functions.storage.object().onFinalize(async (object) => {
      const filePath = object.name;
      if (!filePath) {
        logger.error("file path does not exists");
        return;
      }
      // Only run function if file corrensponds to document
      if (path.dirname(filePath) !== `${colName}/${fieldName}/raw`) return;

      // Get document reference
      const fileName = path.basename(filePath, ".png");
      const docId = fileName.split("_")[1];
      const ref = _firestore.collection(colName).doc(docId);

      // Only run function if document exists
      const doc = await ref.get();
      if (!doc.exists) return;

      // Update document
      const imageData = _imageDataOf(filePath, metadata);
      await update(ref, { [fieldName]: imageData });
    });
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

  function hasDependencyChanged(before: Document, after: Document): boolean {
    for (const key in before) {
      if (!isFieldEqual(before[key], after[key])) {
        return true;
      }
    }
    return false;
  }

  type Document = { [key: string]: Field };

  interface ImageField {
    url?: string;
    width?: number;
    height?: number;
    size?: number;
  }

  type Field =
    | defaultFirestore.Timestamp
    | defaultFirestore.DocumentReference
    | number
    | string
    | ImageField
    | Document;

  function isFieldEqual(before?: Field, after?: Field): boolean {
    if (_.isNil(before)) return _.isNil(after);
    if (before instanceof firestore.Timestamp) {
      if (after instanceof firestore.Timestamp) return before.isEqual(after);
      return false;
    }
    if (before instanceof firestore.DocumentReference) {
      if (after instanceof firestore.DocumentReference) before.isEqual(after);
      return false;
    }
    if (typeof before === "string") {
      if (typeof after === "string") return before === after;
      return false;
    }
    if (typeof before === "number") {
      if (typeof after === "number") return before === after;
      return false;
    }
    if (isImage(before)) {
      if (isImage(after)) return _.isEqual(before, after);
      return false;
    }
    if (isReference(before)) {
      if (isReference(after)) {
        return _(before)
          .keys()
          .every((key) => isFieldEqual(before[key], after[key]));
      }
      return false;
    }
    assertNever(before);
  }

  function isImage(field: unknown): field is ImageField {
    return (
      Object.prototype.hasOwnProperty.call(field, "url") &&
      !Object.prototype.hasOwnProperty.call(field, "reference")
    );
  }

  function isReference(field: unknown): field is { [key: string]: Field } {
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
    change: Change<QueryDocumentSnapshot>,
    rawData: { [fieldName: string]: unknown }
  ) {
    const data = deepOmitNil(rawData);
    if (!data) {
      return;
    }
    const reference = change.after.ref;
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
    useOnImageUploaded,
    imageDataOf,
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
