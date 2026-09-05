import { Effect, SubscriptionRef } from "effect";

import { Settings } from "../settings/service.ts";
import { makeWirePlumberResource } from "./backend/resource.ts";
import {
  initialWirePlumberState,
  type WirePlumberService,
  type WirePlumberState,
} from "./types.ts";

/** Creates the WirePlumber service and restores its starting balance. */
export const makeWirePlumberService = Effect.gen(function* () {
  const settings = yield* Settings;
  const state = yield* SubscriptionRef.make<WirePlumberState>(initialWirePlumberState);

  const initialBalance = yield* settings.balance;
  const backend = yield* makeWirePlumberResource(state, initialBalance);

  return {
    state,
    setCrossfade: (crossfade: number) =>
      Effect.gen(function* () {
        const applied = yield* backend.setCrossfade(crossfade);
        yield* settings.rememberBalance(applied);
        return applied;
      }),
  } satisfies WirePlumberService;
});
