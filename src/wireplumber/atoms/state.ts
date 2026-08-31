import { Effect, Stream, SubscriptionRef } from "effect";
import { Atom } from "effect/unstable/reactivity";

import { WirePlumber } from "../service.ts";
import { wirePlumberRuntime } from "./runtime.ts";

/** Stream-backed source for the latest WirePlumber state. */
const wirePlumberStateSource = wirePlumberRuntime.atom(
  Stream.unwrap(
    Effect.map(WirePlumber, (wirePlumber) => SubscriptionRef.changes(wirePlumber.state)),
  ),
);

/** Reactive result containing the latest state published by WirePlumber. */
export const wirePlumberState = Atom.readable(
  (get) => get(wirePlumberStateSource),
  (refresh) => refresh(wirePlumberRuntime),
);
