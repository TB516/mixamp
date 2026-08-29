import { Data } from "effect";

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
export class WirePlumberSignalSetupError extends Data.TaggedError(
  "WirePlumberSignalSetupError",
)<WirePlumberCause> {}

/** Error raised when the core cannot connect to PipeWire. */
export class WirePlumberConnectionError extends Data.TaggedError(
  "WirePlumberConnectionError",
)<WirePlumberCause> {}

/** Error raised when Mixamp's virtual audio sinks cannot be created. */
export class WirePlumberVirtualSinkError extends Data.TaggedError(
  "WirePlumberVirtualSinkError",
)<WirePlumberCause> {}

/** Error raised when the Game/Voice gain cannot be changed. */
export class WirePlumberCrossfadeError extends Data.TaggedError(
  "WirePlumberCrossfadeError",
)<WirePlumberCause> {}

/** Error raised while removing the core's connection signal handlers. */
export class WirePlumberSignalCleanupError extends Data.TaggedError(
  "WirePlumberSignalCleanupError",
)<WirePlumberCause> {}

/** Error raised while disconnecting the WirePlumber core. */
export class WirePlumberDisconnectionError extends Data.TaggedError(
  "WirePlumberDisconnectionError",
)<WirePlumberCause> {}
