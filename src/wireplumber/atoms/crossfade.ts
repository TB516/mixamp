import { Effect } from "effect";

import { WirePlumber } from "../service.ts";
import { wirePlumberRuntime } from "./runtime.ts";

/** Applies a Game/Voice crossfade requested by the UI. */
export const setWirePlumberCrossfade = wirePlumberRuntime.fn((crossfade: number) =>
  Effect.flatMap(WirePlumber, (wirePlumber) => wirePlumber.setCrossfade(crossfade)),
);
