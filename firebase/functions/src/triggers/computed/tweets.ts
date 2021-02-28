// import { EventContext } from "firebase-functions";
// import { computeTweet, Tweet } from "../models";

// function computeHotness(
//   tweet: Pick<Tweet, "creationTime" | "likesSum">,
//   context: EventContext
// ): number {
//   if (!tweet.creationTime || !tweet.likesSum) {
//     return 0;
//   }
//   const now = Date.parse(context.timestamp);
//   const timeSinceCreated = now - tweet.creationTime.toMillis();
//   return tweet.likesSum / timeSinceCreated;
// }

// export const { onCreate, onUpdate } = computeTweet({
//   onCreate: () => ({ hotness: 0 }),
//   dependencyFields: ["creationTime", "likesSum"],
//   onUpdate: ({ after, context }) => {
//     const hotness = computeHotness(after, context);
//     return { hotness };
//   },
// });
