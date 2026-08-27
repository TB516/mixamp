import { Data } from "effect";

type WirePlumberCause = {
  readonly cause: unknown;
};

/** Error exposed when the WirePlumber service cannot start. */
export class WirePlumberError extends Data.TaggedError("WirePlumberError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

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

/** Error raised while removing the core's connection signal handlers. */
export class WirePlumberSignalCleanupError extends Data.TaggedError(
  "WirePlumberSignalCleanupError",
)<WirePlumberCause> {}

/** Error raised while disconnecting the WirePlumber core. */
export class WirePlumberDisconnectionError extends Data.TaggedError(
  "WirePlumberDisconnectionError",
)<WirePlumberCause> {}
