import { Data } from "effect";

import type { WirePlumberSignal, WirePlumberSink } from "./types.ts";

/** Properties shared by errors that preserve their original cause. */
type WirePlumberCause = {
  /** Original error or value caught from the failed operation. */
  readonly cause: unknown;
};

/** Error raised when libwireplumber initialization fails. */
export class WirePlumberInitializationError extends Data.TaggedError(
  "WirePlumberInitializationError",
)<WirePlumberCause> {}

/** Error raised while creating the WirePlumber core and its properties. */
export class WirePlumberCoreCreationError extends Data.TaggedError(
  "WirePlumberCoreCreationError",
)<WirePlumberCause> {}

/** Error raised while registering the core's connection signals. */
export class WirePlumberSignalSetupError extends Data.TaggedError("WirePlumberSignalSetupError")<
  WirePlumberCause & { readonly signal: WirePlumberSignal }
> {}

/** Error raised when the core cannot connect to PipeWire. */
export class WirePlumberConnectionError extends Data.TaggedError(
  "WirePlumberConnectionError",
)<WirePlumberCause> {}

/** Error raised while preparing the manager that tracks virtual sink playback nodes. */
export class WirePlumberPlaybackNodeManagerError extends Data.TaggedError(
  "WirePlumberPlaybackNodeManagerError",
)<WirePlumberCause> {}

/** Error raised while discovering virtual sink playback nodes. */
export class WirePlumberPlaybackNodeDiscoveryError extends Data.TaggedError(
  "WirePlumberPlaybackNodeDiscoveryError",
)<WirePlumberCause> {}

/** Error raised when a virtual sink's PipeWire loopback module cannot be loaded. */
export class WirePlumberVirtualSinkLoadError extends Data.TaggedError(
  "WirePlumberVirtualSinkLoadError",
)<WirePlumberCause & { readonly sink: WirePlumberSink }> {}

/** Error raised when virtual sink playback nodes do not appear before the timeout. */
export class WirePlumberPlaybackNodeTimeoutError extends Data.TaggedError(
  "WirePlumberPlaybackNodeTimeoutError",
)<{ readonly missing: WirePlumberSink }> {}

/** Error raised when a crossfade value is invalid. */
export class WirePlumberCrossfadeError extends Data.TaggedError(
  "WirePlumberCrossfadeError",
)<WirePlumberCause> {}

/** Error raised when a virtual sink gain cannot be changed. */
export class WirePlumberSinkGainError extends Data.TaggedError("WirePlumberSinkGainError")<
  WirePlumberCause & { readonly sink: WirePlumberSink; readonly gain: number }
> {}

/** Error raised when a failed crossfade cannot restore the previous Game gain. */
export class WirePlumberCrossfadeRollbackError extends Data.TaggedError(
  "WirePlumberCrossfadeRollbackError",
)<{
  readonly crossfade: number;
  readonly previousCrossfade: number;
  readonly updateError: WirePlumberSinkGainError;
  readonly rollbackError: WirePlumberSinkGainError;
}> {}

/** Error raised while removing the core's connection signal handlers. */
export class WirePlumberSignalCleanupError extends Data.TaggedError(
  "WirePlumberSignalCleanupError",
)<WirePlumberCause & { readonly signal: WirePlumberSignal }> {}

/** Error raised while disconnecting the WirePlumber core. */
export class WirePlumberDisconnectionError extends Data.TaggedError(
  "WirePlumberDisconnectionError",
)<WirePlumberCause> {}
