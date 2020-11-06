import { functions } from "../functions";
import * as firebaseFunctions from 'firebase-functions';
import { EventContext, FunctionBuilder } from "firebase-functions";
import { Tweet } from "../models";
import { tweets } from "../flamestore";
// import { ComputeDocument } from "flamestore/lib";

function computeHotness(tweet: Tweet, context: EventContext): number {
  if (!tweet.creationTime) {
    return 1;
  }
  const now = Date.parse(context.timestamp);
  const timeSinceCreated = now - tweet.creationTime.toMillis();
  return tweet.likesSum / timeSinceCreated;
}

type onCreateFn<T, V> = (document: T, context: EventContext) => V;
type onUpdateFn<T, V> = (before: T, after: T, context: EventContext) => V;

abstract class Computed {
  abstract collection: string;
  abstract toMap(): { [fieldName: string]: any };
  abstract document: any;
  abstract isNonComputedSame(before: any, after: any): boolean;
}
class ComputedTweet extends Computed {
  collection: string;
  document!: Tweet;
  hotness?: number;
  constructor(arg?: { hotness?: number }) {
    super();
    this.collection = "tweets";
    this.hotness = arg?.hotness;
  }

  toMap() {
    return {
      hotness: this.hotness,
    };
  }

  isNonComputedSame(before: Tweet, after: Tweet) {
    const a = before?.user?.isEqual ? before.user.isEqual(after?.user) : false;
    const b = before?.userName === after?.userName;
    const c = before?.tweetText === after?.tweetText;
    const d = before?.likesSum === after?.likesSum;
    const e = before?.creationTime?.isEqual ? before.creationTime.isEqual(after?.creationTime) : false;
    firebaseFunctions.logger.log('a', a)
    firebaseFunctions.logger.log('b', b)
    firebaseFunctions.logger.log('c', c)
    firebaseFunctions.logger.log('d', d)
    firebaseFunctions.logger.log('e', e)
    return a && b && c && d && e;
  }
}
class ComputeDocument<V extends Computed, T = V['document']> {
  functions: FunctionBuilder;
  computedDocument: V;
  computeOnCreate: onCreateFn<T, V>;
  computeOnUpdate: onUpdateFn<T, V>;

  constructor({
    functions,
    computedDocument,
    computeOnCreate,
    computeOnUpdate,
  }: {
    functions: FunctionBuilder;
    computedDocument: new () => V,
    computeOnCreate: onCreateFn<T, V>;
    computeOnUpdate: onUpdateFn<T, V>;
  }) {
    this.functions = functions;
    this.computedDocument = new computedDocument();
    this.computeOnCreate = computeOnCreate;
    this.computeOnUpdate = computeOnUpdate;
  }

  private get document() {
    return this.functions.firestore
      .document(`/${this.computedDocument.collection}/{documentId}`);
  }

  public get onCreate() {
    return this.document
      .onCreate(async (snapshot, context) => {
        const newDoc = snapshot.data() as T;
        const result = this.computeOnCreate(newDoc, context);
        firebaseFunctions.logger.log('result', result.toMap());
        await snapshot.ref.update(result.toMap());
      })
  };

  public get onUpdate() {
    return this.document
      .onUpdate(async (change, context) => {
        const before = change.before.data() as T;
        const after = change.after.data() as T;
        if (this.computedDocument.isNonComputedSame(before, after)) {
          return;
        }
        const result = this.computeOnUpdate(before, after, context);
        firebaseFunctions.logger.log('result', result.toMap());
        await change.after.ref.update(result.toMap());
      });
  }

}
const computeTweet = new ComputeDocument({
  functions,
  computedDocument: ComputedTweet,
  computeOnCreate() {
    return new ComputedTweet({ hotness: 0 })
  },
  computeOnUpdate(_, after, context) {
    const hotness = computeHotness(after, context);
    return new ComputedTweet({ hotness })
  }
});

export const onCreate = computeTweet.onCreate;
export const onUpdate = computeTweet.onUpdate;