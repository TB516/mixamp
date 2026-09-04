import { Effect, SubscriptionRef } from "effect";
import { Atom } from "effect/unstable/reactivity";

import { makeBackgroundResource } from "./backend/resource.ts";
import { initialBackgroundState } from "./types.ts";

/** Creates the reactive state and its scoped portal resource. */
const makeBackgroundState = Effect.gen(function* () {
  const state = yield* SubscriptionRef.make(initialBackgroundState);
  return yield* makeBackgroundResource(state);
});

/** Permission state published by the background service. */
export const backgroundState = Atom.subscriptionRef(makeBackgroundState);
