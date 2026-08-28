import { Effect, Stream, SubscriptionRef } from "effect";

import { WirePlumber } from "../service.js";
import { wirePlumberRuntime } from "./runtime.js";

/** Reactive result containing the latest state published by WirePlumber. */
export const wirePlumberState = wirePlumberRuntime.atom(
  Stream.unwrap(
    Effect.map(WirePlumber, (wirePlumber) => SubscriptionRef.changes(wirePlumber.state)),
  ),
);
