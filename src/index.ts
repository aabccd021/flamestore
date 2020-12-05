import { firestore } from 'firebase-admin';
import { Change, EventContext } from "firebase-functions";
import { QueryDocumentSnapshot } from "firebase-functions/lib/providers/firestore";
import * as _functions from 'firebase-functions';
import { ProjectConfiguration } from './type';
export { ProjectConfiguration } from './type';
export async function allSettled(promises: Promise<any>[]): Promise<any> {
  return Promise.all(promises.map((p) => p.catch((_) => null)));
}
export async function update(
  ref: firestore.DocumentReference,
  data: { [fieldName: string]: any; }
) {
  _functions.logger.log(`Update ${ref.id}`, { data: data });
  if (Object.keys(data).length > 0) {
    await ref.update(data);
  }
}
export abstract class Computed {
  abstract collection: string;
  abstract toMap(): { [fieldName: string]: any };
  abstract document: any;
  abstract isDependencyChanged(before: any, after: any, keys: any[]): boolean;
}
export function flamestoreUtils(
  project: ProjectConfiguration,
  firestore: firestore.Firestore,
  functions: _functions.FunctionBuilder,
) {
  // const createDynamicLink = async (
  //   collectionName: string,
  //   id: string,
  //   socialTitle?: string,
  //   socialDescription?: string,
  //   socialImageLink?: string
  // ) => {
  //   const dynamicLinkInfo: DynamicLinkInfo = {
  //     dynamicLinkInfo: {
  //       domainUriPrefix: `https://${project.dynamicLinkDomain}`,
  //       link: `https://${project.domain}/${collectionName}/${id}`,
  //       androidInfo: {
  //         androidPackageName: project.androidPackageName,
  //       },
  //       socialMetaTagInfo: {
  //         socialTitle,
  //         socialDescription,
  //         socialImageLink,
  //       }
  //     }
  //   };
  //   removeEmpty(dynamicLinkInfo);
  //   const url = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${project.apiKey}`;
  //   const opts: RequestInit = {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(dynamicLinkInfo),
  //   };
  //   const res = await fetch(url, opts);
  //   _functions.logger.log('Created dynamic link', res);
  // };
  const foundDuplicate = async (
    collectionName: string,
    fieldName: string,
    snapshotOrChange: QueryDocumentSnapshot |
      Change<QueryDocumentSnapshot>,
    context: EventContext
  ): Promise<boolean> => {
    function isSnapshot(value: QueryDocumentSnapshot |
      Change<QueryDocumentSnapshot>): value is QueryDocumentSnapshot {
      return !value.hasOwnProperty('after');
    }
    const snapshot = isSnapshot(snapshotOrChange) ? snapshotOrChange : snapshotOrChange.after;
    const duplicates = await firestore
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
        await snapshotOrChange.before.ref.update({ [fieldName]: snapshotOrChange.before.data()[fieldName] });
      }
      return true;
    }
    return false;
  };

  const syncField = async (
    collection: string,
    refField: string,
    ref: firestore.DocumentReference,
    data: { [fieldName: string]: any; }
  ) => {
    if (Object.keys(data).length === 0) {
      return;
    }
    const querySnapshot = await firestore
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
    _functions.logger.log(
      `Update where ${collection}.${refField}.id == ${ref.id} success on ${results.length - filteredResult.length} documents`,
      { updateData: data }
    );
    if (filteredResult.length > 0) {
      _functions.logger.warn(
        `Update where ${collection}.${refField}== ${ref.id} fail on ${filteredResult.length} documents`,
        { documentIds: filteredResult }
      );
    }
  };

  const computeDocumentFactory = () => {
    return class ComputeDocument<V extends Computed, K extends keyof T, T = V["document"]> {
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

      public get document() {
        return functions.firestore
          .document(`/${this.computedDocument.collection}/{documentId}`);
      }

      public get onCreate() {
        return this.document.onCreate(async (snapshot, context) => {
          const newDoc = snapshot.data() as T;
          const result = this.computeOnCreate(newDoc, context).toMap();
          await update(snapshot.ref, result);
        });
      }

      public get onUpdate() {
        return this.document.onUpdate(async (change, context) => {
          const before = change.before.data() as T;
          const after = change.after.data() as T;
          const pickedBefore = pick(before, this.dependenciesOnUpdate);
          const pickedAfter = pick(after, this.dependenciesOnUpdate);
          const dependencyChanged = this.computedDocument.isDependencyChanged(before, after, this.dependenciesOnUpdate);
          if (!dependencyChanged) {
            return;
          }
          const result = this.computeOnUpdate(pickedBefore, pickedAfter, context).toMap();
          await update(change.after.ref, result);
        });
      }
    }

  }
  return { foundDuplicate, syncField, computeDocumentFactory };
}

const removeEmpty = (obj: any) => {
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === "object") removeEmpty(obj[key]);
    else if (obj[key] == null) delete obj[key];
  });
};

type onCreateFn<T, V> = (document: T, context: EventContext) => V;
type onUpdateFn<T, V> = (before: T, after: T, context: EventContext) => V;
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return obj as Pick<T, K>;
}