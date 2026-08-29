import { Effect, Stream, SubscriptionRef } from "effect";

import { WirePlumber } from "../service.ts";
import { wirePlumberRuntime } from "./runtime.ts";

/** Reactive result containing the latest state published by WirePlumber. */
export const wirePlumberState = wirePlumberRuntime.atom(
  Stream.unwrap(
    Effect.map(WirePlumber, (wirePlumber) => SubscriptionRef.changes(wirePlumber.state)),
  ),
);
