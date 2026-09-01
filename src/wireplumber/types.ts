import { Effect, SubscriptionRef } from "effect";

import type {
  WirePlumberCrossfadeError,
  WirePlumberCrossfadeRollbackError,
  WirePlumberSinkGainError,
} from "./errors.ts";

/** Core connection signals tracked by Mixamp. */
export type WirePlumberSignal = "connected" | "disconnected";

/** Mixamp virtual sink identifiers. */
export type WirePlumberSink = "game" | "voice";

/** Display names published for Mixamp's virtual sinks. */
export const wirePlumberSinkNames = {
  game: "Mixamp Game",
  voice: "Mixamp Voice",
} satisfies Record<WirePlumberSink, string>;

/** State published by the WirePlumber service. */
export type WirePlumberState = {
  /** Whether the WirePlumber core is connected to PipeWire. */
  readonly connected: boolean;
  /** Game/Voice balance from -1 (Game) through 0 (balanced) to 1 (Voice). */
  readonly crossfade: number;
  /** Virtual sinks created by Mixamp. */
  readonly sinks: {
    /** Game sink. */
    readonly game: {
      /** Display name of the Game sink. */
      readonly name: string;
    };
    /** Voice sink. */
    readonly voice: {
      /** Display name of the Voice sink. */
      readonly name: string;
    };
  };
};

/** Initial state before WirePlumber reports a connection. */
export const initialWirePlumberState: WirePlumberState = {
  connected: false,
  crossfade: 0,
  sinks: {
    game: { name: wirePlumberSinkNames.game },
    voice: { name: wirePlumberSinkNames.voice },
  },
};

/** Service value exposed to Effects that use Mixamp's audio controls. */
export type WirePlumberService = {
  /** State published by the service. */
  readonly state: SubscriptionRef.SubscriptionRef<WirePlumberState>;
  /** Applies the Game/Voice balance and returns the clamped crossfade value. */
  readonly setCrossfade: (
    crossfade: number,
  ) => Effect.Effect<
    number,
    WirePlumberCrossfadeError | WirePlumberSinkGainError | WirePlumberCrossfadeRollbackError
  >;
};
