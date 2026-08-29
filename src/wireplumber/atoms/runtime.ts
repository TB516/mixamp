import { Atom } from "effect/unstable/reactivity";

import { WirePlumberLive } from "../service.ts";

/** Atom runtime that provides the WirePlumber service to reactive operations. */
export const wirePlumberRuntime = Atom.runtime(WirePlumberLive);
