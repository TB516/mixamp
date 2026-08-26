import type * as Wp from "@gtkx/gi/wp";
import { SubscriptionRef } from "effect";

/** State published by the WirePlumber connection. */
export type WirePlumberConnectionState = {
  readonly connected: boolean;
};

/** Initial state before WirePlumber reports a connection. */
export const initialWirePlumberConnectionState: WirePlumberConnectionState = {
  connected: false,
};

/** Service value available to Effects that need the native WirePlumber core. */
export type WirePlumberService = {
  readonly core: Wp.Core;
  readonly state: SubscriptionRef.SubscriptionRef<WirePlumberConnectionState>;
};
