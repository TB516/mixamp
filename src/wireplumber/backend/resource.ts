import * as Wp from "@gtkx/gi/wp";
import { Effect, Scope, SubscriptionRef } from "effect";

import {
  WirePlumberConnectionError,
  WirePlumberCoreCreationError,
  WirePlumberDisconnectionError,
  WirePlumberInitializationError,
  WirePlumberPlaybackNodeDiscoveryError,
  WirePlumberPlaybackNodeManagerError,
  WirePlumberPlaybackNodeTimeoutError,
  WirePlumberSignalCleanupError,
  WirePlumberSignalSetupError,
  WirePlumberVirtualSinkLoadError,
} from "../errors.ts";
import type { WirePlumberService, WirePlumberSignal, WirePlumberState } from "../types.ts";
import { setVirtualSinkCrossfade } from "./sinks/crossfade.ts";
import { makeVirtualSinks } from "./sinks/virtual-sinks.ts";

/** Initializes the WirePlumber library and its SPA types. */
const initializeWirePlumber: Effect.Effect<void, WirePlumberInitializationError> = Effect.try({
  try: () => Wp.init(Wp.InitFlags.PIPEWIRE | Wp.InitFlags.SPA_TYPES),
  catch: (cause) => new WirePlumberInitializationError({ cause }),
});

/** Creates a WirePlumber core configured for Mixamp. */
const makeCore: Effect.Effect<
  Wp.Core,
  WirePlumberInitializationError | WirePlumberCoreCreationError
> = Effect.gen(function* () {
  yield* initializeWirePlumber;

  return yield* Effect.try({
    try: () => {
      const applicationProperties = Wp.Properties.newEmpty();
      applicationProperties.set("application.id", "io.github.TB516.mixamp");
      applicationProperties.set("application.name", "Mixamp");

      return Wp.Core.new(null, null, applicationProperties);
    },
    catch: (cause) => new WirePlumberCoreCreationError({ cause }),
  });
});

/** Connects a WirePlumber core to PipeWire. */
const connectCore = (core: Wp.Core): Effect.Effect<void, WirePlumberConnectionError> =>
  Effect.try({
    try: () => {
      if (!core.coreConnect()) {
        throw new WirePlumberConnectionError({
          cause: "Wp.Core.coreConnect() returned false",
        });
      }
    },
    catch: (cause) => {
      if (cause instanceof WirePlumberConnectionError) {
        return cause;
      }

      return new WirePlumberConnectionError({ cause });
    },
  });

/** Registers a scoped handler for a WirePlumber core signal. */
const acquireCoreSignal = (
  core: Wp.Core,
  signal: WirePlumberSignal,
  handler: () => void,
): Effect.Effect<number, WirePlumberSignalSetupError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.try({
      try: () => core.connect(signal, handler),
      catch: (cause) => new WirePlumberSignalSetupError({ signal, cause }),
    }),
    (handlerId) =>
      Effect.try({
        try: () => core.disconnect(handlerId),
        catch: (cause) => new WirePlumberSignalCleanupError({ signal, cause }),
      }).pipe(Effect.orDie),
  );

/** Disconnects the core and publishes its disconnected state. */
const releaseCore = (core: Wp.Core, state: SubscriptionRef.SubscriptionRef<WirePlumberState>) =>
  Effect.try({
    try: () => {
      if (core.isConnected()) {
        core.coreDisconnect();
      }
    },
    catch: (cause) => new WirePlumberDisconnectionError({ cause }),
  }).pipe(
    Effect.ensuring(SubscriptionRef.update(state, (current) => ({ ...current, connected: false }))),
    Effect.orDie,
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
  | WirePlumberInitializationError
  | WirePlumberCoreCreationError
  | WirePlumberSignalSetupError
  | WirePlumberConnectionError
  | WirePlumberPlaybackNodeManagerError
  | WirePlumberPlaybackNodeDiscoveryError
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
    yield* SubscriptionRef.update(state, (current) => ({
      ...current,
      connected: core.isConnected(),
    }));
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
