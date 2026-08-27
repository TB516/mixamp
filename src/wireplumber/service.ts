import { Context, Effect, Layer, SubscriptionRef } from "effect";

import { makeWirePlumberConnection } from "./resource.js";
import {
  initialWirePlumberConnectionState,
  type WirePlumberConnectionState,
  type WirePlumberService,
} from "./types.js";

const makeWirePlumberService = Effect.gen(function* () {
  const state = yield* SubscriptionRef.make<WirePlumberConnectionState>(
    initialWirePlumberConnectionState,
  );

  return yield* makeWirePlumberConnection(state);
});

/** Effect context tag for the active WirePlumber service. */
export const WirePlumber = Context.Service<WirePlumberService>(
  "io.github.TB516.mixamp/WirePlumber",
);

/** Layer that acquires one WirePlumber connection per runtime scope. */
export const WirePlumberLive = Layer.effect(WirePlumber, makeWirePlumberService);
