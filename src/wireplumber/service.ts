import { Context, Effect, Layer, SubscriptionRef } from "effect";

import { makeWirePlumberResource } from "./backend/resource.ts";
import {
  initialWirePlumberState,
  type WirePlumberState,
  type WirePlumberService,
} from "./types.ts";

/** Creates the state and backend resource for the WirePlumber service. */
const makeWirePlumberService = Effect.gen(function* () {
  const state = yield* SubscriptionRef.make<WirePlumberState>(initialWirePlumberState);

  return yield* makeWirePlumberResource(state);
});

/** Effect context tag for the active WirePlumber service. */
export const WirePlumber = Context.Service<WirePlumberService>(
  "io.github.TB516.mixamp/WirePlumber",
);

/** Layer that acquires one WirePlumber service per runtime scope. */
export const WirePlumberLive = Layer.effect(WirePlumber, makeWirePlumberService);
