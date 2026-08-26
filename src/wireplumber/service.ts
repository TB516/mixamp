import { Context, Effect, Layer, Scope, SubscriptionRef } from "effect";
import { WirePlumberError } from "./errors.js";
import { makeWirePlumberConnection } from "./resource.js";
import {
  initialWirePlumberConnectionState,
  type WirePlumberConnectionState,
  type WirePlumberService,
} from "./types.js";

const makeWirePlumberService: Effect.Effect<WirePlumberService, WirePlumberError, Scope.Scope> =
  Effect.gen(function* () {
    const state = yield* SubscriptionRef.make<WirePlumberConnectionState>(
      initialWirePlumberConnectionState,
    );

    return yield* makeWirePlumberConnection(state);
  }).pipe(
    Effect.mapError(
      (cause) =>
        new WirePlumberError({
          message: "Could not start Mixamp's WirePlumber client",
          cause,
        }),
    ),
  );

/** Effect context tag for the active WirePlumber service. */
export const WirePlumber = Context.Service<WirePlumberService>(
  "io.github.TB516.mixamp/WirePlumber",
);

/** Layer that acquires one WirePlumber connection per runtime scope. */
export const WirePlumberLive = Layer.effect(WirePlumber, makeWirePlumberService);
