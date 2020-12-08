import { EventContext } from "firebase-functions";
import { ComputedTweet, ITweet } from "../models";
import { ComputeDocument } from "../utils";

function computeHotness(
  tweet: Pick<ITweet, "creationTime" | "likesSum">,
  context: EventContext,
): number {
  if (!tweet.creationTime || !tweet.likesSum) {
    return 0;
  }
  const now = Date.parse(context.timestamp);
  const timeSinceCreated = now - tweet.creationTime.toMillis();
  return tweet.likesSum / timeSinceCreated;
}

const computeTweet = new ComputeDocument({
  computedDocument: ComputedTweet,
  computeOnCreate() {
    return new ComputedTweet({ hotness: 0 });
  },
  dependenciesOnUpdate: ["creationTime", "likesSum"],
  computeOnUpdate(_, after, context) {
    const hotness = computeHotness(after, context);
    return new ComputedTweet({ hotness });
  }
});

export const onCreate = computeTweet.onCreate;
export const onUpdate = computeTweet.onUpdate;
