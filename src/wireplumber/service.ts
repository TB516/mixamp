import { Effect, SubscriptionRef } from "effect";

import { makeWirePlumberResource } from "./backend/resource.ts";
import { initialWirePlumberState, type WirePlumberState } from "./types.ts";

/** Creates the state and backend resource for the WirePlumber service. */
export const makeWirePlumberService = Effect.gen(function* () {
  const state = yield* SubscriptionRef.make<WirePlumberState>(initialWirePlumberState);

  return yield* makeWirePlumberResource(state);
});
