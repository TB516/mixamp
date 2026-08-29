import type * as Wp from "@gtkx/gi/wp";
import { Effect, SubscriptionRef } from "effect";

import type { WirePlumberCrossfadeError } from "./errors.js";
import { sinkDefinitions } from "./sinks/definitions.js";

/** State published by the WirePlumber service. */
export type WirePlumberState = {
  readonly connected: boolean;
  /** Game/Voice balance from -1 (Game) through 0 (balanced) to 1 (Voice). */
  readonly crossfade: number;
  readonly sinks: {
    readonly game: {
      readonly name: string;
    };
    readonly voice: {
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
  readonly core: Wp.Core;
  readonly state: SubscriptionRef.SubscriptionRef<WirePlumberState>;
  /** Applies the Game/Voice balance and returns the clamped crossfade value. */
  readonly setCrossfade: (crossfade: number) => Effect.Effect<number, WirePlumberCrossfadeError>;
};
