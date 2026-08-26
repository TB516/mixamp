/** Effect service and live layer for the WirePlumber connection. */
export { WirePlumber, WirePlumberLive } from "./service.js";

/** React provider and hook for consuming the connection from UI code. */
export { WirePlumberProvider, useWirePlumber } from "./provider.js";

/** Connection state, service, and error types. */
export {
  initialWirePlumberConnectionState,
  type WirePlumberConnectionState,
  type WirePlumberService,
} from "./types.js";
export { WirePlumberError } from "./errors.js";
