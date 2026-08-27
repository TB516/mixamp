import { Atom } from "effect/unstable/reactivity";

import { WirePlumberLive } from "../service.js";

/** Atom runtime that provides the WirePlumber service to reactive operations. */
export const wirePlumberRuntime = Atom.runtime(WirePlumberLive);
