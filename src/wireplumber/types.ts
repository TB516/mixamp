import type * as Wp from "@gtkx/gi/wp";
import { Effect, SubscriptionRef } from "effect";

import type { WirePlumberCrossfadeError } from "./errors.ts";
import { sinkDefinitions } from "./sinks/definitions.ts";

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
    game: { name: sinkDefinitions.game.name },
    voice: { name: sinkDefinitions.voice.name },
  },
};

/** Service value available to Effects that need the native WirePlumber core. */
export type WirePlumberService = {
  /** Active WirePlumber core. */
  readonly core: Wp.Core;
  /** State published by the service. */
  readonly state: SubscriptionRef.SubscriptionRef<WirePlumberState>;
  /** Applies the Game/Voice balance and returns the clamped crossfade value. */
  readonly setCrossfade: (crossfade: number) => Effect.Effect<number, WirePlumberCrossfadeError>;
};
