import { firestore } from "firebase-admin";
import { functions } from "../functions";
import { EventContext, FunctionBuilder } from "firebase-functions";

interface Tweet {
  user: firestore.DocumentReference;
  userName: string;
  tweetText: string;
  likesSum: number;
  creationTime: firestore.Timestamp;
  hotness: number;
}

abstract class ComputedDocument {
  abstract collection: string;
  abstract toMap(): { [fieldName: string]: any };
  abstract document: any;
}

class ComputedTweet extends ComputedDocument {
  collection: string;
  document!: Tweet;
  hotness?: number;
  constructor(arg?: {
    hotness?: number
  }) {
    super();
    this.collection = 'tweets';
    this.hotness = arg?.hotness;
  }

  toMap() {
    return {
      hotness: this.hotness
    }
  }
}

type onCreateFn<T, V> = (document: T, context: EventContext) => V;
type onUpdateFn<T, V> = (before: T, after: T, context: EventContext) => V;

class ComputeDocument<V extends ComputedDocument, T = V['document']> {
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
    return this.functions
      .firestore
      .document(`/${this.computedDocument.collection}/{documentId}`);
  }

  public onCreate = this.document
    .onCreate(async (snapshot, context) => {
      const newDoc = snapshot.data() as T;
      const result = this.computeOnCreate(newDoc, context);
      await snapshot.ref.update(result.toMap());
    });

  public onUpdate = this.document
    .onUpdate(async (change, context) => {
      const before = change.before.data() as T;
      const after = change.after.data() as T;
      const result = this.computeOnUpdate(before, after, context);
      await change.after.ref.update(result.toMap());
    });
}






























function computeHotness(tweet: Tweet, context: EventContext): number {
  const now = Date.parse(context.timestamp);
  const timeSinceCreated = now - tweet.creationTime.toMillis();
  return tweet.likesSum / timeSinceCreated;
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

