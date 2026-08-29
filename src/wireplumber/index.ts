/** Reactive WirePlumber state and controls exposed to the UI. */
export { setWirePlumberCrossfade, wirePlumberState } from "./atoms/index.ts";

/** React mount that keeps the WirePlumber connection active. */
export { WirePlumberConnectionMount } from "./connection-mount.tsx";

/** State published by the WirePlumber connection atom. */
export { type WirePlumberState } from "./types.ts";
