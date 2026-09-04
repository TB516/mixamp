import * as Wp from "@gtkx/gi/wp";
import { Effect, Scope, SubscriptionRef } from "effect";

import {
  WirePlumberConnectionError,
  WirePlumberPlaybackNodeTimeoutError,
  WirePlumberVirtualSinkLoadError,
} from "../errors.ts";
import type { WirePlumberService, WirePlumberSignal, WirePlumberState } from "../types.ts";
import { setVirtualSinkCrossfade } from "./sinks/crossfade.ts";
import { makeVirtualSinks } from "./sinks/virtual-sinks.ts";

/** Initializes the WirePlumber library and its SPA types. */
const initializeWirePlumber = Effect.sync(() =>
  Wp.init(Wp.InitFlags.PIPEWIRE | Wp.InitFlags.SPA_TYPES),
);

/** Creates a WirePlumber core configured for Mixamp. */
const makeCore: Effect.Effect<Wp.Core> = Effect.gen(function* () {
  yield* initializeWirePlumber;

  const applicationProperties = Wp.Properties.newEmpty();
  applicationProperties.set("application.id", "io.github.TB516.mixamp");
  applicationProperties.set("application.name", "Mixamp");

  return Wp.Core.new(null, null, applicationProperties);
});

/** Connects a WirePlumber core to PipeWire. */
const connectCore = (core: Wp.Core): Effect.Effect<void, WirePlumberConnectionError> =>
  Effect.gen(function* () {
    const connected = core.coreConnect();

    if (connected) {
      return;
    }

    return yield* new WirePlumberConnectionError({
      cause: "Wp.Core.coreConnect() returned false",
    });
  });

/** Registers a scoped handler for a WirePlumber core signal. */
const acquireCoreSignal = (
  core: Wp.Core,
  signal: WirePlumberSignal,
  handler: () => void,
): Effect.Effect<number, never, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => core.connect(signal, handler)),
    (handlerId) => Effect.sync(() => core.disconnect(handlerId)),
  );

/** Disconnects the core and publishes its disconnected state. */
const releaseCore = (core: Wp.Core, state: SubscriptionRef.SubscriptionRef<WirePlumberState>) =>
  Effect.ensuring(
    Effect.sync(() => {
      if (core.isConnected()) {
        core.coreDisconnect();
      }
    }),
    SubscriptionRef.update(state, (current) => ({ ...current, connected: false })),
  );

/**
 * Creates the scoped WirePlumber backend resource.
 *
 * The returned Effect owns the core and its signal handlers until its scope closes.
 */
export const makeWirePlumberResource = (
  state: SubscriptionRef.SubscriptionRef<WirePlumberState>,
): Effect.Effect<
  WirePlumberService,
  | WirePlumberConnectionError
  | WirePlumberVirtualSinkLoadError
  | WirePlumberPlaybackNodeTimeoutError,
  Scope.Scope
> =>
  Effect.gen(function* () {
    const context = yield* Effect.context<never>();
    const core = yield* Effect.acquireRelease(makeCore, (core) => releaseCore(core, state));

    yield* acquireCoreSignal(core, "connected", () =>
      Effect.runSyncWith(context)(
        SubscriptionRef.update(state, (current) => ({ ...current, connected: true })),
      ),
    );
    yield* acquireCoreSignal(core, "disconnected", () =>
      Effect.runSyncWith(context)(
        SubscriptionRef.update(state, (current) => ({ ...current, connected: false })),
      ),
    );

    yield* connectCore(core);
    yield* SubscriptionRef.update(state, (current) => ({ ...current, connected: true }));

    const playbackNodes = yield* makeVirtualSinks(core);

    return {
      state,
      setCrossfade: (crossfade) =>
        Effect.gen(function* () {
          const { crossfade: previousCrossfade } = yield* SubscriptionRef.get(state);
          const value = yield* setVirtualSinkCrossfade(playbackNodes, crossfade, previousCrossfade);

          yield* SubscriptionRef.update(state, (current) => ({
            ...current,
            crossfade: value,
          }));

          return value;
        }),
    };
  });
