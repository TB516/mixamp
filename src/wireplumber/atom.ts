import { Effect } from "effect";
import { Atom } from "effect/unstable/reactivity";

import type {
  WirePlumberCrossfadeError,
  WirePlumberCrossfadeRollbackError,
  WirePlumberSinkGainError,
} from "./errors.ts";
import { makeWirePlumberService } from "./service.ts";
import type { WirePlumberState } from "./types.ts";

/** Atoms created from one successfully initialized WirePlumber service. */
export type WirePlumberModel = {
  /** Current state published by the WirePlumber service. */
  readonly state: Atom.Writable<WirePlumberState>;
  /** Applies a Game/Voice crossfade through the WirePlumber service. */
  readonly setCrossfade: Atom.AtomResultFn<
    number,
    number,
    WirePlumberCrossfadeError | WirePlumberSinkGainError | WirePlumberCrossfadeRollbackError
  >;
};

/** Initializes WirePlumber and creates the atoms that use its service. */
export const wirePlumber = Atom.make(
  makeWirePlumberService.pipe(
    Effect.map((service): WirePlumberModel => ({
      state: Atom.subscriptionRef(service.state),
      setCrossfade: Atom.fn((crossfade: number) => service.setCrossfade(crossfade)),
    })),
  ),
);
