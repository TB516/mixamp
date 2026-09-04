import { Data } from "effect";

/** Operations that can fail while talking to the desktop background portal. */
export type BackgroundPortalOperation = "connect" | "request" | "response" | "status";

/** Error raised by the XDG background portal resource. */
export class BackgroundPortalError extends Data.TaggedError("BackgroundPortalError")<{
  readonly operation: BackgroundPortalOperation;
  readonly cause: unknown;
}> {}
